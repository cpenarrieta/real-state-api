import { MyContext, PropertyArgs, LeadAnalytic } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { property_status, published_status } from "@prisma/client";
import { findUser } from "../users";
import { compareAsc, addDays, format } from "date-fns";

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
      address1: true,
      address2: true,
      zipCode: true,
      city: true,
      community: true,
      country: true,
      bathrooms: true,
      province: true,
      bedrooms: true,
      builtYear: true,
      currency: true,
      price: true,
      description: true,
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
      mainPictureLowRes: true,
      mainImageId: true,
      webPaidUntil: true,
      username: true,
      videoUrl: true,
      videoType: true,
      color: true,
      listingId: true,
      lat: true,
      lon: true,
    },
  });

  if (!property) {
    throw new ApolloError("Property not found");
  }

  return property;
};

export const dashboard = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
  const uuid = ctx.req.user?.sub;
  const user = await findUser(ctx, uuid || "");

  // TODO: is it faster to first get the User and then search by user instead of uuid?
  const properties = ctx.prisma.property.findMany({
    where: {
      status: {
        in: [property_status.ACTIVE, property_status.SOLD],
      },
      user: {
        uuid,
      },
    },
    select: {
      uuid: true,
      title: true,
      address1: true,
      address2: true,
      zipCode: true,
      city: true,
      province: true,
      country: true,
      community: true,
      bathrooms: true,
      bedrooms: true,
      builtYear: true,
      currency: true,
      price: true,
      description: true,
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
      mainPictureLowRes: true,
      mainImageId: true,
      color: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const resultAnalytics = await ctx.prisma.$queryRaw<LeadAnalytic[]>`
    WITH analytics_users as (
      SELECT  v."visitorId", date_trunc('day', v."createdAt") as day, count(*)
      FROM public.visitor as v
      inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
      Where  v."createdAt" > current_date - interval '7 days'
      Group by v."visitorId", day
      ORDER BY day desc
    )
    
    SELECT
      SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
      SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
      SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days"
    FROM public.visitor as v
      inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
    Where  v."createdAt" > current_date - interval '7 days'
    
    union
    
    SELECT
      SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
      SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
      SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days"
    FROM public.lead as l
      inner join public.property as p on p.id = l."propertyId" and p."userId" = ${user.id}
    Where  l."createdAt" > current_date - interval '7 days'
    
    union 
    
    SELECT
      SUM(CASE WHEN v.day = current_date THEN 1 ELSE 0 END) as "today",
      SUM(CASE WHEN v.day = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
      SUM(CASE WHEN v.day > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days"
    FROM analytics_users as v
    `;

  let visits: LeadAnalytic | null | undefined = null;
  let leads: LeadAnalytic | null | undefined = null;
  let users: LeadAnalytic | null | undefined = null;
  if (resultAnalytics && resultAnalytics.length >= 1) {
    visits = resultAnalytics[0];
    if (resultAnalytics.length >= 2) {
      leads = resultAnalytics[1] || null;
    }
    if (resultAnalytics.length >= 3) {
      users = resultAnalytics[2] || null;
    }
  }

  return {
    properties,
    visits,
    leads,
    users,
  };
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
      status: {
        in: [property_status.ACTIVE, property_status.SOLD],
      },
      user: {
        uuid,
      },
    },
    select: {
      uuid: true,
      title: true,
      address1: true,
      address2: true,
      zipCode: true,
      city: true,
      province: true,
      country: true,
      community: true,
      bathrooms: true,
      bedrooms: true,
      builtYear: true,
      currency: true,
      price: true,
      description: true,
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
      mainPictureLowRes: true,
      mainImageId: true,
      color: true,
    },
    orderBy: {
      createdAt: "desc",
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

export const otherProperties = async (
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

  return await ctx.prisma.property.findMany({
    select: {
      title: true,
      uuid: true,
      bedrooms: true,
      bathrooms: true,
      price: true,
      mainPictureLowRes: true,
      currency: true,
      status: true,
      city: true,
      hidePrice: true,
    },
    where: {
      username: user.username,
      publishedStatus: "PUBLISHED",
      status: "ACTIVE",
      uuid: {
        not: property.uuid,
      },
      mainPicture: {
        not: null,
      },
    },
    take: 6,
  });
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
          username: user.username,
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
        country,
        lat,
        lon,
        bathrooms,
        bedrooms,
        currency,
        builtYear,
        propertyType,
        price,
        lotSize,
        listingId,
        grossTaxesLastYear,
        description,
        videoUrl,
        videoType,
        mainPicture,
        mainPictureLowRes,
        mainImageId,
        color,
        hidePrice,
        strata,
      } = args?.property;

      let data = {
        title,
        address1,
        address2,
        zipCode,
        city,
        province,
        community,
        country,
        lat,
        lon,
        bathrooms,
        bedrooms,
        builtYear,
        propertyType,
        price,
        currency,
        lotSize,
        listingId,
        grossTaxesLastYear,
        description,
        videoUrl,
        videoType,
        color,
        hidePrice,
        strata,
      } as object;

      if (mainImageId) {
        data = {
          ...data,
          mainPicture,
          mainPictureLowRes,
          images_imagesToproperty_mainImageId: {
            connect: {
              id: mainImageId,
            },
          },
        };
      }

      if (!propertyUpdated.title && !title && address1) {
        data = {
          ...data,
          title: address1,
        };
      }

      propertyUpdated = await ctx.prisma.property.update({
        where: {
          id: propertyUpdated.id,
        },
        data,
      });

      return propertyUpdated;
    } catch (e) {
      throw new ApolloError("Error updating property");
    }
  }
};

export const publishProperty = async (
  parent: object,
  args: { propertyUuid: string },
  ctx: MyContext
) => {
  let propertyUuid = args?.propertyUuid;
  const userUuid = ctx.req.user?.sub || "";
  const user = await findUser(ctx, userUuid);
  const propertyUpdated = await findProperty(ctx, propertyUuid);

  // TODO: when user is admin and have manage:publish-property scope
  if (propertyUpdated?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  if (!propertyUpdated.webPaidUntil) {
    throw new ApolloError("Property does not have a valid payment");
  }

  // IS PAID VALID
  if (compareAsc(addDays(propertyUpdated.webPaidUntil, 7), new Date()) === 1) {
    // TODO: save from previous to publish table
    try {
      await ctx.prisma.property.update({
        where: {
          id: propertyUpdated.id,
        },
        data: {
          publishedStatus: published_status.PUBLISHED,
        },
      });

      return true;
    } catch (e) {
      throw new ApolloError("Error Publishing Property");
    }
  }

  throw new ApolloError(
    `Property does not have a valid payment - ${format(
      propertyUpdated.webPaidUntil,
      "dd/MM/yyyy"
    )}`
  );
};

export const deleteProperty = async (
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

  await ctx.prisma.property.update({
    where: {
      uuid: propertyUuid,
    },
    data: {
      status: "INACTIVE",
      publishedStatus: "INACTIVE",
    },
  });

  return true;
};

export const markAsSold = async (
  parent: object,
  args: { uuid: string; undo: boolean },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const undo = args?.undo;
  const user = await findUser(ctx, userUuid);

  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  if (!undo) {
    await ctx.prisma.property.update({
      where: {
        uuid: propertyUuid,
      },
      data: {
        status: "SOLD",
      },
    });
  } else {
    await ctx.prisma.property.update({
      where: {
        uuid: propertyUuid,
      },
      data: {
        status: property.status === "SOLD" ? "ACTIVE" : property.status,
      },
    });
  }

  return true;
};
