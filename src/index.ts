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
import { PRICE_ID_LIFETIME_US, PRICE_ID_LIFETIME_CA } from "./priceUtil";

export const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
  app.set("trust proxy", true);

  app.use(
    cors({
      origin: [process.env.APP_URL || "", process.env.STATIC_URL || ""],
      credentials: true,
    })
  );

  app.get("/home_static/properties", async (req: MyRequest, res) => {
    try {
      const properties = await prisma.property.findMany({
        select: {
          uuid: true,
          username: true,
        },
        where: {
          status: {
            in: ["ACTIVE", "SOLD"],
          },
          publishedStatus: "PUBLISHED",
        },
      });

      res.send(properties);
    } catch (e) {
      res.status(500).send("Error getting all Properties");
    }
  });

  app.get("/home_static/users", async (req: MyRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          username: true,
        },
        where: {
          active: true,
        },
      });

      res.send(users);
    } catch (e) {
      res.status(500).send("Error getting all users");
    }
  });

  app.get("/home_static/user/:username", async (req: MyRequest, res) => {
    try {
      const username = req.params.username;
      const users = await prisma.user.findMany({
        where: {
          username: username,
        },
      });

      if (users && users.length > 0) {
        res.send(users);
      } else {
        res.status(400).send({ message: "user not found" });
      }
    } catch (e) {
      res.status(500).send("Error getting user");
    }
  });

  app.get(
    "/home_static/property/:username/:propertyId",
    async (req: MyRequest, res) => {
      const propertyId = req.params.propertyId;
      const username = req.params.username;

      let property = null;
      let otherProperties = [];
      let attachments = [];
      let images = [];
      let openHouse = [];

      try {
        const data = await prisma.$queryRaw(`
          SELECT p.*,
            u.email as "userEmail", 
            u."firstName" as "userFirstName", 
            u."lastName" as "userLastName", 
            u.phone as "userPhone", 
            u.picture as "userPicture", 
            u."pictureLowRes" as "userPictureLowRes",
            u.address1 as "userAddress1", 
            u.address2 as "userAddress2", 
            u.city as "userCity", 
            u.province as "userProvince", 
            u."zipCode" as "userZipcode", 
            u.country as "userCountry",
            u."smallBio" as "userSmallBio"
          FROM public.property as p
            INNER JOIN public.user as u on u.id = p."userId"
          WHERE p.status in ('ACTIVE', 'SOLD') and p."publishedStatus" = 'PUBLISHED' and p.uuid = '${propertyId}'
        `);

        if (!data || data.length <= 0) {
          return res.status(400).send({ message: "property not found" });
        }
        property = data[0];

        // OTHER PROPERTIES FROM USER
        try {
          const dataOther = await prisma.$queryRaw(`
            Select title, uuid, bedrooms, bathrooms, price, "mainPictureLowRes", currency, status, city, "hidePrice"
            from public.property
            where username = '${username}' and 
              uuid <> '${propertyId}' and 
              "publishedStatus" = 'PUBLISHED' and
              status = 'ACTIVE' and 
              "mainPictureLowRes" IS NOT NULL
            ORDER BY "updatedAt" desc
            limit 6
          `);

          if (!dataOther || dataOther.length <= 0) {
            otherProperties = [];
          } else {
            otherProperties = dataOther;
          }
        } catch (err) {
          otherProperties = [];
        }

        // ATTACHMENTS
        try {
          const dataAttachments = await prisma.$queryRaw(`
            Select *
            from public.attachments
            where "propertyId" = ${property.id} and active=true
            ORDER BY "updatedAt" desc
          `);

          if (!dataAttachments || dataAttachments.length <= 0) {
            attachments = [];
          } else {
            attachments = dataAttachments;
          }
        } catch (err) {
          attachments = [];
        }

        // IMAGES
        try {
          const dataImages = await prisma.$queryRaw(`
            Select id, url, "urlLowRes"
            from public.images
            where "propertyId" = ${property.id} and active=true`);

          if (!dataImages || dataImages.length <= 0) {
            images = [];
          } else {
            images = dataImages;
          }
        } catch (err) {
          images = [];
        }

        // OPEN HOUSE
        try {
          const dataOpenHouse = await prisma.$queryRaw(`
            Select *
            from public."openHouse"
            where "propertyId" = ${property.id}
            ORDER BY date asc
          `);

          if (!dataOpenHouse || dataOpenHouse.length <= 0) {
            openHouse = [];
          } else {
            openHouse = dataOpenHouse;
          }
        } catch (err) {
          openHouse = [];
        }

        return res.send({
          property,
          otherProperties,
          attachments,
          images,
          openHouse,
        });
      } catch (e) {
        console.log(e);
        return res.status(500).send("Error getting property");
      }
    }
  );

  app.get("/config/:country", async (req: MyRequest, res) => {
    const country = req.params.country;
    let lifetime;

    if (country === "US") {
      lifetime = await stripe.prices.retrieve(PRICE_ID_LIFETIME_US);
    } else if (country === "CA") {
      lifetime = await stripe.prices.retrieve(PRICE_ID_LIFETIME_CA);
    } else {
      res.send({ error: true });
    }

    res.send({
      lifetime: {
        id: lifetime.id,
        currency: lifetime.currency,
        amount: lifetime.unit_amount / 100,
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

  app.listen(process.env.PORT, () => {
    console.log("API server started 🚀 🚀 🚀 - Port ", process.env.PORT);
  });
})();
