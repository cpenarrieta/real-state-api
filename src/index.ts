import "dotenv/config";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import cors from "cors";
import prisma, { createContext, MyRequest } from "./context";
import jwt from "express-jwt";
import jwks from "jwks-rsa";
import bodyParser from "body-parser";
import { activateProperty } from "./services/activateProperty";
import { stripe } from "../src/services/stripe";

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

  app.get("/config", requireAuth, async (req: MyRequest, res) => {
    const userUuid = req.user?.sub;
    const user = await prisma.user.findOne({
      where: {
        uuid: userUuid,
      },
      select: {
        country: true,
      },
    });

    let lifetime, oneYear;

    if (user && user.country === "US") {
      lifetime = await stripe.prices.retrieve("price_1HUnynJTQgPl8Cr4f0eF9Tbv");
      oneYear = await stripe.prices.retrieve("price_1HUneuJTQgPl8Cr4RpMANhId");
    } else if (user && user.country === "CA") {
      lifetime = await stripe.prices.retrieve("price_1HUnynJTQgPl8Cr49GidXV5a");
      oneYear = await stripe.prices.retrieve("price_1HUneuJTQgPl8Cr43Ll1vIZD");
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
      const { productType, propertyId } = req.body;
      const userUuid = req.user?.sub;
      const price = await stripe.prices.retrieve(productType);
      const user = await prisma.user.findOne({
        where: {
          uuid: userUuid,
        },
        select: {
          stripeId: true,
        },
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "en",
        customer: user?.stripeId,
        line_items: [
          {
            price_data: {
              currency: price.currency,
              product: price.product,
              unit_amount: price.unit_amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          propertyId,
          product: price.product,
          userUuid,
        },
        success_url: `${domainURL}/payment-success?session_id={CHECKOUT_SESSION_ID}&propertyId=${propertyId}`,
        cancel_url: req.headers.referer,
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

      // TODO how to pass metadata to charge.succeeded
      switch (event.type) {
        case "checkout.session.completed":
          const sessionComplete = event.data.object;
          const { product, userUuid } = sessionComplete?.metadata;
          const productData = await stripe.products.retrieve(product);

          await activateProperty(
            sessionComplete,
            productData?.metadata?.type,
            userUuid || ""
          );
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
