import { allUsers, verifyUser, me, saveUser } from "../users";
import {
  myProperties,
  myProperty,
  saveProperty,
  publishProperty,
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
import { propertyLeads, updateLead } from "../lead";

export const resolvers = {
  Query: {
    users: allUsers,
    properties: myProperties,
    property: myProperty,
    me: me,
    attachments: propertyAttachments,
    propertyImages,
    propertyLeads,
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
