import { MyContext, PropertyArgs } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { property_status, property_type } from "@prisma/client";
import { findUser } from "../users";

const Hashids = require("hashids/cjs");
const hashids = new Hashids(process.env.HASH_SALT, 10);

export const findProperty = async (ctx: MyContext, uuid: string) => {
  const property = await ctx.prisma.property.findOne({
    where: {
      uuid,
    },
    select: {
      id: true,
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
      mainPicture: true,
    },
  });

  if (!property) {
    throw new ApolloError("Property not found");
  }

  return property;
};

export const myProperties = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
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
      province: true,
      community: true,
      bathrooms: true,
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
      mainPicture: true,
    },
  });

  return properties;
};

export const myProperty = async (
  parent: object,
  args: { uuid: string },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const user = await findUser(ctx, userUuid);

  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  return property;
};

const getPropertyType = (propertyType?: string) => {
  if (propertyType === property_type.HOUSE) {
    return property_type.HOUSE;
  }
  if (propertyType === property_type.TOWNHOUSE) {
    return property_type.TOWNHOUSE;
  }
  if (propertyType === property_type.CONDO) {
    return property_type.CONDO;
  }
  if (propertyType === property_type.LAND) {
    return property_type.LAND;
  }
  if (propertyType === property_type.OTHER) {
    return property_type.OTHER;
  }
  return undefined;
};

export const saveProperty = async (
  parent: object,
  args: { property: PropertyArgs },
  ctx: MyContext
) => {
  let propertyUuid = args?.property?.uuid;
  const userUuid = ctx.req.user?.sub || "";
  const user = await findUser(ctx, userUuid);

  if (!propertyUuid) {
    try {
      let propertySaved = await ctx.prisma.property.create({
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
      throw new ApolloError("Error saving property");
    }
  } else {
    let propertyUpdated = await findProperty(ctx, propertyUuid);

    if (propertyUpdated?.userId !== user.id) {
      throw new ApolloError("Property does not belongs to User");
    }

    try {
      const {
        title,
        address1,
        address2,
        zipCode,
        city,
        province,
        community,
        bathrooms,
        bedrooms,
        builtYear,
        propertyType,
      } = args?.property;

      propertyUpdated = await ctx.prisma.property.update({
        where: {
          id: propertyUpdated.id,
        },
        data: {
          title,
          address1,
          address2,
          zipCode,
          city,
          province,
          community,
          bathrooms,
          bedrooms,
          builtYear,
          propertyType: getPropertyType(propertyType),
        },
      });

      return propertyUpdated;
    } catch (e) {
      throw new ApolloError("Error updating property");
    }
  }
};
