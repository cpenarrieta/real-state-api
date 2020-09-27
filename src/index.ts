import "dotenv/config";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import cors from "cors";
import { createContext, MyRequest } from "./context";
import jwt from "express-jwt";
import jwks from "jwks-rsa";
import bodyParser from "body-parser";
import { activateProperty } from "./services/activateProperty";
import { stripe } from "../src/services/stripe";
import {
  PRICE_ID_LIFETIME_US,
  PRICE_ID_YEAR_US,
  PRICE_ID_LIFETIME_CA,
  PRICE_ID_YEAR_CA,
} from "./priceUtil";

const requireAuth = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.AUTH0_JWKS_URI as string,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_JWKS_ISSUER,
  algorithms: ["RS256"],
});

(async () => {
  const app = express();
  app.use(
    cors({
      origin: [process.env.APP_URL || ""],
      credentials: true,
    })
  );

  app.get("/config/:country", async (req: MyRequest, res) => {
    const country = req.params.country;
    let lifetime, oneYear;

    if (country === "US") {
      lifetime = await stripe.prices.retrieve(PRICE_ID_LIFETIME_US);
      oneYear = await stripe.prices.retrieve(PRICE_ID_YEAR_US);
    } else if (country === "CA") {
      lifetime = await stripe.prices.retrieve(PRICE_ID_LIFETIME_CA);
      oneYear = await stripe.prices.retrieve(PRICE_ID_YEAR_CA);
    } else {
      res.send({ error: true });
    }

    res.send({
      lifetime: {
        id: lifetime.id,
        currency: lifetime.currency,
        amount: lifetime.unit_amount / 100,
      },
      oneYear: {
        id: oneYear.id,
        currency: oneYear.currency,
        amount: oneYear.unit_amount / 100,
      },
    });
  });

  // Fetch the Checkout Session to display the JSON result on the success page
  app.get("/checkout-session", requireAuth, async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  });

  app.use("/create-checkout-session", bodyParser.json());
  app.post(
    "/create-checkout-session",
    requireAuth,
    async (req: MyRequest, res) => {
      const domainURL = process.env.APP_URL;
      const { productType, propertyId, email } = req.body;
      const userUuid = req.user?.sub;
      const price = await stripe.prices.retrieve(productType);
      const metadata = {
        propertyId,
        priceId: price.id,
        userUuid,
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "en",
        customer_email: email,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        metadata,
        success_url: `${domainURL}/payment-success?session_id={CHECKOUT_SESSION_ID}&propertyId=${propertyId}`,
        cancel_url: req.headers.referer,
        client_reference_id: propertyId,
        payment_intent_data: {
          receipt_email: email,
          metadata,
        },
      });

      res.send({
        sessionId: session.id,
      });
    }
  );

  app.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (request: MyRequest, response) => {
      const sig = request.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
      }

      switch (event.type) {
        case "charge.succeeded":
          const sessionComplete = event.data.object;
          await activateProperty(sessionComplete);
          break;
        default:
          return response.status(400).end();
      }

      response.json({ received: true });
    }
  );

  app.post("/graphql", requireAuth, async (req: MyRequest, res, next) => {
    next();
  });

  const apolloServer = new ApolloServer({
    playground: true,
    typeDefs,
    resolvers,
    context: ({ req, res }) => {
      return createContext(req, res);
    },
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("express server started 🚀 🚀 🚀 - Port ", 4000);
  });
})();
