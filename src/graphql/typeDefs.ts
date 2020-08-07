import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  type User {
    uuid: ID
    email: String
    createdAt: Date
    updatedAt: Date
    property: [Property]
  }

  type Property {
    uuid: ID
    title: String
  }

  input PropertyInput {
    uuid: String
    title: String
  }

  type Query {
    users: [User]
    properties: [Property]
    me: User
  }

  type Mutation {
    logout: Boolean
    saveProperty(property: PropertyInput): Property
    verifyUser: Boolean
  }
`;
