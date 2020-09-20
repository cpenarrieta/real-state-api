import { MyContext, LeadAnalytic } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

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
    throw new ApolloError("Error getting leads");
  }
};

export const updateLead = async (
  parent: object,
  args: {
    id: number;
    uuid: string;
    leadStatus: "STARRED" | "ARCHIVED" | "PENDING" | "CONTACTED" | "BUYER";
    notes: string;
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const id = args?.id;
  const leadStatus = args?.leadStatus;
  const notes = args?.notes;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
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
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const id = args?.id;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  try {
    const result = await ctx.prisma.$queryRaw<[LeadAnalytic]>`
      SELECT
        ${id} as id,
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM public.lead as l 
        inner join public.visitor as v on l."visitorId" = v."visitorId"
      Where l.id = ${id} and v."createdAt" > current_date - interval '180 days';
    `;

    return result && result.length ? result[0] : [];
  } catch (e) {
    throw new ApolloError("Error updating leads");
  }
};
