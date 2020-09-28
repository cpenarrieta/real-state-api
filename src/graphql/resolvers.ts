import { allUsers, verifyUser, me, saveUser } from "../users";
import {
  myProperties,
  myProperty,
  saveProperty,
  publishProperty,
  otherProperties,
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
import { propertyLeads, updateLead, leadAnalytics } from "../lead";
import { propertyAnalytics } from "../analytics";
import { propertyOrders, orders } from "../orders";

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
  },
};
