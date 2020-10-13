import {
  allUsers,
  verifyUser,
  me,
  saveUser,
  completeOnboarding,
  deleteAccount,
  activateAccount,
} from "../users";
import {
  myProperties,
  myProperty,
  saveProperty,
  publishProperty,
  otherProperties,
  deleteProperty,
  markAsSold,
  dashboard,
} from "../properties";
import { signS3 } from "../services/signS3";
import {
  saveAttachment,
  deleteAttachment,
  propertyAttachments,
} from "../attachments";
import {
  propertyImages,
  savePropertyImages,
  deleteImage,
  updateImagesOrder,
} from "../images";
import { propertyLeads, updateLead, leadAnalytics, leads } from "../lead";
import { propertyAnalytics, analytics } from "../analytics";
import { propertyOrders, orders } from "../orders";
import { propertyOpenHouse, saveOpenHouse } from "../openHouse";

export const resolvers = {
  Query: {
    users: allUsers,
    properties: myProperties,
    property: myProperty,
    me,
    attachments: propertyAttachments,
    propertyImages,
    propertyLeads,
    leadAnalytics,
    propertyAnalytics,
    otherProperties,
    propertyOrders,
    orders,
    leads,
    dashboard,
    analytics,
    propertyOpenHouse,
  },
  Mutation: {
    saveProperty: saveProperty,
    verifyUser: verifyUser,
    saveUser: saveUser,
    publishProperty: publishProperty,
    signS3: signS3,
    saveAttachment: saveAttachment,
    deleteAttachment: deleteAttachment,
    savePropertyImages,
    deleteImage,
    updateImagesOrder,
    updateLead,
    deleteProperty,
    markAsSold,
    completeOnboarding,
    deleteAccount,
    activateAccount,
    saveOpenHouse,
  },
};
