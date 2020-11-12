import { MyContext, RawAnalytic } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

export const leads = async (parent: object, args: object, ctx: MyContext) => {
  const userUuid = ctx.req.user?.sub || "";

  const user = await findUser(ctx, userUuid);

  try {
    const leads = await ctx.prisma.lead.findMany({
      where: {
        userId: {
          equals: user.id,
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (leads && leads.length > 1) {
      return leads.map((l) => {
        return {
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          type: l.type,
          userId: l.userId,
          leadStatus: l.leadStatus,
          visitorId: l.visitorId,
          createdAt: l.createdAt,
          notes: l.notes,
          uuid: l.property?.uuid,
          image: l.property?.mainPictureLowRes,
          title: l.property?.title,
          city: l.property?.city,
          province: l.property?.province,
          zipCode: l.property?.zipCode,
          address1: l.property?.address1,
        };
      });
    }

    return leads;
  } catch (e) {
    throw new ApolloError("Error getting leads");
  }
};

export const propertyLeads = async (
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

  try {
    const leads = await ctx.prisma.lead.findMany({
      where: {
        propertyId: property.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        leadStatus: true,
        visitorId: true,
        createdAt: true,
        notes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return leads;
  } catch (e) {
    throw new ApolloError("Error getting property leads");
  }
};

export const updateLead = async (
  parent: object,
  args: {
    id: number;
    uuid: string;
    leadStatus: "STARRED" | "ARCHIVED" | "PENDING" | "CONTACTED" | "BUYER";
    notes: string;
    type: "PROPERTY" | "USER";
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const id = args?.id;
  const leadStatus = args?.leadStatus;
  const notes = args?.notes;
  const type = args?.type;

  const user = await findUser(ctx, userUuid);

  if (type === "PROPERTY") {
    const property = await findProperty(ctx, propertyUuid);

    if (!property) {
      throw new UserInputError("Invalid Property");
    }

    if (property?.userId !== user.id) {
      throw new ApolloError("Property does not belongs to User");
    }
  }

  try {
    await ctx.prisma.lead.update({
      where: {
        id,
      },
      data: {
        leadStatus,
        notes,
      },
    });

    return true;
  } catch (e) {
    throw new ApolloError("Error updating leads");
  }
};

export const leadAnalytics = async (
  parent: object,
  args: {
    id: number;
    uuid: string;
    type: "PROPERTY" | "USER";
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const id = args?.id;
  const type = args?.type;

  const user = await findUser(ctx, userUuid);

  if (type === "PROPERTY") {
    const property = await findProperty(ctx, propertyUuid);

    if (!property) {
      throw new UserInputError("Invalid Property");
    }

    if (property?.userId !== user.id) {
      throw new ApolloError("Property does not belongs to User");
    }

    try {
      const result = await ctx.prisma.$queryRaw<RawAnalytic[]>`
        SELECT date_trunc('day', v."createdAt") as day, count(*)
        FROM public.lead as l 
          inner join public.visitor as v on l."visitorId" = v."visitorId" and l."propertyId" = v."propertyId"
        Where l.id = ${id} and  v."createdAt" > current_date - interval '180 days'
        Group by day
        ORDER BY day asc
      `;

      return result && result.length ? result : [];
    } catch (e) {
      throw new ApolloError("Error getting leadAnalytics");
    }
  } else {
    try {
      const result = await ctx.prisma.$queryRaw<RawAnalytic[]>`
        SELECT date_trunc('day', v."createdAt") as day, count(*)
        FROM public.lead as l 
          inner join public.visitor as v on l."visitorId" = v."visitorId" and l."userId" = v."userId"
        Where l.id = ${id} and  v."createdAt" > current_date - interval '180 days'
        Group by day
        ORDER BY day asc
      `;

      return result && result.length ? result : [];
    } catch (e) {
      throw new ApolloError("Error getting leadAnalytics");
    }
  }
};
