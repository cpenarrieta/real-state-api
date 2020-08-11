import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  enum PROPERTY_STATUS {
    ACTIVE
    HOLD
    INACTIVE
    SOLD
  }

  enum PUBLISHED_STATUS {
    DRAFT
    PUBLISHED
    INACTIVE
  }

  enum PROPERTY_TYPE {
    CONDO
    HOUSE
    LAND
    OTHER
    TOWNHOUSE
  }

  enum CURRENCY {
    CAD
    USD
  }

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
    createdAt: Date
    updatedAt: Date
    description: String
    bedrooms: Int
    bathrooms: Int
    lotSize: Int
    builtYear: Int
    grossTaxesLastYear: Int
    openHouse: Boolean
    strata: Boolean
    price: Int
    hidePrice: Boolean
    fullAddress: String
    community: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    pictures: [String]
    floorPlans: [String]
    mainPicture: String
    videos: [String]
    soldAt: Date
    propertyType: PROPERTY_TYPE
    currency: CURRENCY
    status: PROPERTY_STATUS
    user: User
    publishedStatus: PUBLISHED_STATUS
  }

  input PropertyInput {
    uuid: String
    title: String
    createdAt: Date
    updatedAt: Date
    description: String
    bedrooms: Int
    bathrooms: Int
    lotSize: Int
    builtYear: Int
    grossTaxesLastYear: Int
    openHouse: Boolean
    strata: Boolean
    price: Int
    hidePrice: Boolean
    fullAddress: String
    community: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    pictures: [String]
    floorPlans: [String]
    mainPicture: String
    videos: [String]
    soldAt: Date
    propertyType: PROPERTY_TYPE
    currency: CURRENCY
    status: PROPERTY_STATUS
    publishedStatus: PUBLISHED_STATUS
  }

  type Query {
    users: [User]
    properties: [Property]
    property(uuid: String!): Property
  }

  type Mutation {
    saveProperty(property: PropertyInput): Property
    verifyUser: Boolean
  }
`;
