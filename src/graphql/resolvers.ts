import { MyContext, PropertyArgs } from "../context";
import { property_status } from "@prisma/client";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-express";

const Hashids = require("hashids/cjs");
const hashids = new Hashids(process.env.HASH_SALT, 10);

const findUser = async (ctx: MyContext, uuid: string) => {
  const user = await ctx.prisma.user.findOne({
    where: {
      uuid,
    },
  });

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return user;
};

export const resolvers = {
  Query: {
    users: async (parent: object, args: object, ctx: MyContext) => {
      const users = await ctx.prisma.user.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return users;
    },
    properties: async (parent: object, args: object, ctx: MyContext) => {
      const uuid = ctx.req.user?.sub;

      // TODO: is it faster to first get the User and then search by user instead of uuid?
      const properties = ctx.prisma.property.findMany({
        where: {
          status: property_status.ACTIVE,
          user: {
            uuid,
          },
        },
        select: {
          uuid: true,
          title: true,
          fullAddress: true,
          address1: true,
          address2: true,
          zipCode: true,
          city: true,
          community: true,
          bathrooms: true,
          province: true,
          bedrooms: true,
          builtYear: true,
          currency: true,
          price: true,
          description: true,
          pictures: true,
          videos: true,
          floorPlans: true,
          grossTaxesLastYear: true,
          hidePrice: true,
          lotSize: true,
          openHouse: true,
          propertyType: true,
          status: true,
          createdAt: true,
          soldAt: true,
          strata: true,
          updatedAt: true,
          publishedStatus: true,
        },
      });

      return properties;
    },
    property: async (
      parent: object,
      args: { uuid: string },
      ctx: MyContext
    ) => {
      const userUuid = ctx.req.user?.sub || "";
      const propertyUuid = args?.uuid;
      const user = await findUser(ctx, userUuid);

      const property = await ctx.prisma.property.findOne({
        where: {
          uuid: propertyUuid,
        },
        select: {
          uuid: true,
          title: true,
          fullAddress: true,
          address1: true,
          address2: true,
          zipCode: true,
          city: true,
          community: true,
          bathrooms: true,
          province: true,
          bedrooms: true,
          builtYear: true,
          currency: true,
          price: true,
          description: true,
          pictures: true,
          videos: true,
          floorPlans: true,
          grossTaxesLastYear: true,
          hidePrice: true,
          lotSize: true,
          openHouse: true,
          propertyType: true,
          status: true,
          createdAt: true,
          soldAt: true,
          strata: true,
          updatedAt: true,
          userId: true,
          publishedStatus: true,
        },
      });

      if (!property) {
        throw new UserInputError("Invalid Property");
      }

      if (property?.userId !== user.id) {
        throw new ApolloError("Property does not belongs to User");
      }

      return property;
    },
    me: async (parent: object, args: object, ctx: MyContext) => {
      return null;
    },
  },
  Mutation: {
    saveProperty: async (
      parent: object,
      args: { property: PropertyArgs },
      ctx: MyContext
    ) => {
      let propertyUuid = args?.property?.uuid;
      const userUuid = ctx.req.user?.sub || "";
      let propertySaved = null;

      const user = await findUser(ctx, userUuid);

      if (!propertyUuid) {
        try {
          propertySaved = await ctx.prisma.property.create({
            data: {
              user: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
          propertyUuid = hashids.encode(propertySaved.id);
          propertySaved = await ctx.prisma.property.update({
            data: {
              uuid: propertyUuid,
            },
            where: {
              id: propertySaved.id,
            },
          });
          return propertySaved;
        } catch (e) {
          //TODO: report error to Bugsnag? NewRelic?
          throw new ApolloError("Error sdaving property");
        }
      } else {
        // search for property
        // check if user login owns this property
        // update property
      }

      return {};
    },
    verifyUser: async (parent: object, args: object, ctx: MyContext) => {
      const uuid = ctx.req.user?.sub;

      if (!uuid) return false;

      await ctx.prisma.user.upsert({
        create: {
          uuid,
        },
        update: {
          uuid,
        },
        where: {
          uuid,
        },
      });

      return true;
    },
  },
};
