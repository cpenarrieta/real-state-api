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

  enum VIDEO_TYPE {
    VIMEO
    YOUTUBE
  }

  type User {
    uuid: ID
    email: String
    firstName: String
    lastName: String
    phone: String
    address: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    country: String
    picture: String
    pictureLowRes: String
    createdAt: Date
    updatedAt: Date
    property: [Property]
    username: String
  }

  type Attachment {
    id: Int
    title: String
    url: String
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
    community: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    country: String
    pictures: [String]
    floorPlans: [String]
    mainPicture: String
    mainPictureLowRes: String
    videos: [String]
    soldAt: Date
    webPaidUntil: Date
    propertyType: PROPERTY_TYPE
    currency: CURRENCY
    status: PROPERTY_STATUS
    user: User
    publishedStatus: PUBLISHED_STATUS
    username: String
    videoUrl: String
    videoType: VIDEO_TYPE
    color: String
    listingId: String
    lat: Float
    lon: Float
    attachments: [Attachment]
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
    community: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    country: String
    pictures: [String]
    floorPlans: [String]
    mainPicture: String
    mainPictureLowRes: String
    videos: [String]
    soldAt: Date
    propertyType: PROPERTY_TYPE
    currency: CURRENCY
    status: PROPERTY_STATUS
    publishedStatus: PUBLISHED_STATUS
    videoUrl: String
    videoType: VIDEO_TYPE
    color: String
    listingId: String
    lat: Float
    lon: Float
    attachments: [AttachmentInput]
  }

  input UserInput {
    email: String
    firstName: String
    lastName: String
    phone: String
    address: String
    picture: String
    pictureLowRes: String
    address1: String
    address2: String
    city: String
    province: String
    zipCode: String
    country: String
    username: String
  }

  input AttachmentInput {
    title: String
    url: String
  }

  type S3Payload {
    signedRequest: String!
    url: String!
  }

  type Query {
    users: [User]
    properties: [Property]
    property(uuid: String!): Property
    attachments(uuid: String!): [Attachment]
    me: User
  }

  type Mutation {
    saveProperty(property: PropertyInput): Property
    saveUser(user: UserInput): User
    verifyUser: Boolean
    publishProperty(propertyUuid: String): Boolean
    signS3(filename: String!, filetype: String!): S3Payload!
    saveAttachment(url: String!, title: String!, uuid: String!): Boolean
    deleteAttachment(id: Int): Boolean
  }
`;
