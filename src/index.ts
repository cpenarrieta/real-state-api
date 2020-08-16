import "dotenv/config";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import cors from "cors";
import { createContext, MyRequest } from "./context";
import cookieParser from "cookie-parser";
import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

(async () => {
  const app = express();
  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  );
  app.use(cookieParser());

  const requireAuth = jwt({
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: process.env.AUTH0_JWKS_URI as string
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_JWKS_ISSUER,
    algorithms: ['RS256']
  });

  app.post('/graphql', requireAuth, async (req: MyRequest, res, next) => {
    next();
  });

  app.get("/", (_req, res) => res.send("hello"));

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
