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

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

(async () => {
  const app = express();
  app.use(
    cors({
      origin: [process.env.APP_URL || ""],
      credentials: true,
    })
  );

  // TODO change this to retrieve list of available Products with Prices
  app.get("/config", async (req, res) => {
    const price = await stripe.prices.retrieve(process.env.PRICE);

    res.send({
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
      unitAmount: price.unit_amount,
      currency: price.currency,
    });
  });

  // Fetch the Checkout Session to display the JSON result on the success page
  app.get("/checkout-session", async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  });

  app.use("/create-checkout-session", bodyParser.json());
  app.post("/create-checkout-session", async (req, res) => {
    const domainURL = process.env.APP_URL;
    const { productType, propertyId, email } = req.body;
    const price = await stripe.prices.retrieve(productType);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      locale: "en",
      customer_email: email,
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
      },
      success_url: `${domainURL}/payment-success?session_id={CHECKOUT_SESSION_ID}&propertyId=${propertyId}`,
      cancel_url: `${domainURL}/payment/${propertyId}`, // req.headers.referer
    });

    res.send({
      sessionId: session.id,
    });
  });

  app.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (request, response) => {
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
          const { propertyId, product } = sessionComplete?.metadata;
          const productData = await stripe.products.retrieve(product);
          await activateProperty(propertyId, productData?.metadata?.type);
          break;
        default:
          return response.status(400).end();
      }

      response.json({ received: true });
    }
  );

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
    console.log("express server started");
  });
})();
