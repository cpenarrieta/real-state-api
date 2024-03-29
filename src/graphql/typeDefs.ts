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

  enum LEAD_STATUS {
    ARCHIVED
    BUYER
    CONTACTED
    PENDING
    STARRED
  }

  enum VISITOR_TYPE {
    PROPERTY
    USER
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
    smallBio: String
    twitterLink: String
    instagramLink: String
    facebookLink: String
    website: String
    profileComplete: Boolean
    onboardingComplete: Boolean
    duplicateUsername: Boolean
    trialUsed: Boolean
  }

  type Attachment {
    id: Int
    title: String
    url: String
    property: [Property]
    active: Boolean
  }

  type PropertyAnalytic {
    id: Int
    visitsRaw: [RawAnalytic]
    usersRaw: [RawAnalytic]
    leadsRaw: [RawAnalytic]
  }

  type Image {
    id: Int
    title: String
    description: String
    url: String
    urlLowRes: String
    property: [Property]
    active: Boolean
    order: Int
  }

  type Lead {
    id: Int
    name: String
    phone: String
    email: String
    visitorId: String
    type: VISITOR_TYPE
    leadStatus: LEAD_STATUS
    createdAt: Date
    updatedAt: Date
    order: Int
    notes: String
    uuid: String
    image: String
    title: String
    city: String
    province: String
    zipCode: String
    address1: String
    userId: Int
  }

  input ImagesInput {
    id: Int
    order: Int
    title: String
    description: String
    url: String
    urlLowRes: String
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
    floorPlans: [String]
    mainPicture: String
    mainPictureLowRes: String
    mainImageId: Int
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
    openHouseActive: Boolean
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
    floorPlans: [String]
    mainPicture: String
    mainPictureLowRes: String
    mainImageId: Int
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
    openHouseActive: Boolean
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
    smallBio: String
    twitterLink: String
    instagramLink: String
    facebookLink: String
    website: String
  }

  input AttachmentInput {
    title: String
    url: String
  }

  type S3Payload {
    signedRequest: String!
    url: String!
  }

  type Order {
    chargeId: ID
    paymentIntentId: String
    customerId: String
    priceId: String
    priceType: String
    priceCountry: String
    amountTotal: Int
    refunded: Boolean
    paid: Boolean
    receiptUrl: String
    paymentType: String
    currency: String
    billingCountry: String
    billingPostal: String
    billingEmail: String
    billingName: String
    paymentMethod: String
    status: String
    createdAt: Date
    updatedAt: Date
    title: String
    uuid: String
    image: String
  }

  type Dashboard {
    newLeads: Int
    properties: [Property]
  }

  type RawAnalytic {
    day: Date
    count: Int
  }

  type OpenHouse {
    id: Int
    date: Date
    timeStart: Date
    timeEnd: Date
  }

  input OpenHouseInput {
    id: Int
    date: String
    start: String
    end: String
  }

  type UserAnalytic {
    visitsRaw: [RawAnalytic]
    usersRaw: [RawAnalytic]
    leadsRaw: [RawAnalytic]
  }

  type Query {
    users: [User]
    properties: [Property]
    property(uuid: String!): Property
    attachments(uuid: String!): [Attachment]
    propertyImages(uuid: String!): [Image]
    propertyLeads(uuid: String!): [Lead]
    leads: [Lead]
    otherProperties(uuid: String!): [Property]
    me: User
    leadAnalytics(id: Int!, uuid: String, type: VISITOR_TYPE): [RawAnalytic]
    propertyAnalytics(uuid: String!): PropertyAnalytic
    propertyOrders(uuid: String!): [Order]
    orders: [Order]
    dashboard: Dashboard
    analytics: UserAnalytic
    propertyOpenHouse(uuid: String!): [OpenHouse]
  }

  type Mutation {
    saveProperty(property: PropertyInput): Property
    saveUser(user: UserInput): User
    verifyUser: String
    signS3(filename: String!, filetype: String!): S3Payload!
    saveAttachment(url: String!, title: String!, uuid: String!): Boolean
    deleteAttachment(id: Int!): Boolean
    deleteOpenHouse(id: Int!): Boolean
    deleteImage(id: Int!, uuid: String!): Boolean
    savePropertyImages(images: [ImagesInput]!, uuid: String!): Boolean
    updateImagesOrder(images: [ImagesInput]!, uuid: String!): Boolean
    updateLead(
      id: Int!
      uuid: String
      leadStatus: LEAD_STATUS!
      notes: String
      type: VISITOR_TYPE
    ): Boolean
    deleteProperty(uuid: String!): Boolean
    markAsSold(uuid: String!, undo: Boolean): Boolean
    completeOnboarding: Boolean
    publishFreeWebsite(uuid: String!): Boolean
    deleteAccount: Boolean
    activateAccount: Boolean
    saveOpenHouse(openHouse: [OpenHouseInput]!, uuid: String!): Boolean
  }
`;
