import "dotenv/config";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import cors from "cors";
import { createContext } from "./context";
import cookieParser from "cookie-parser";

(async () => {
  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());

  // app.post('/graphql', async (req: MyRequest, res, next) => {
  //   const authorization = req.headers.authorization;
  //   if (authorization) {
  //     try { 
  //       const token = authorization.split(" ")[1];
  //       const payload = await firebase.auth().verifyIdToken(token);

  //       req.user = {
  //         userId: payload.uid,
  //         email: payload.email,
  //         role: payload.admin,
  //       };
  //     } catch (e) {
  //       console.error("ERROR with verifyIdToken");
  //     }
  //   }
  //   next();
  // });

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
