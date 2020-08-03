import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  type User {
    id: ID
    uid: String
    firstName: String
    lastName: String
    email: String
    createdAt: Date
    updatedAt: Date
    properties: [Property]
  }

  type Property {
    id: ID
    title: String
  }


  type Query {
    users: [User]
    properties: [Property]
    me: User
  }

  type Mutation {
    logout: Boolean
  }
`;
