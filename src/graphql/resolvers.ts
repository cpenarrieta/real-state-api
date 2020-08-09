import { allUsers, verifyUser } from "../users";
import { myProperties, myProperty, saveProperty } from "../properties";

export const resolvers = {
  Query: {
    users: allUsers,
    properties: myProperties,
    property: myProperty,
  },
  Mutation: {
    saveProperty: saveProperty,
    verifyUser: verifyUser,
  },
};
