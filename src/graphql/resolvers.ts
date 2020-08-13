import { allUsers, verifyUser, me, saveUser } from "../users";
import { myProperties, myProperty, saveProperty } from "../properties";

export const resolvers = {
  Query: {
    users: allUsers,
    properties: myProperties,
    property: myProperty,
    me: me,
  },
  Mutation: {
    saveProperty: saveProperty,
    verifyUser: verifyUser,
    saveUser: saveUser,
  },
};
