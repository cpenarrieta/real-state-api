import { MyContext, RawAnalytic } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

export const propertyAnalytics = async (
  parent: object,
  args: {
    uuid: string;
  },
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
    const visitsRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      SELECT date_trunc('day', v."createdAt") as day, count(*)
      FROM public.visitor as v
      Where  v."createdAt" > current_date - interval '180 days' and "propertyId" = ${property.id}
      Group by day
      ORDER BY day asc
    `;

    const leadsRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      SELECT date_trunc('day', l."createdAt") as day, count(*)
      FROM public.lead as l
      Where  l."createdAt" > current_date - interval '180 days' and "propertyId" = ${property.id}
      Group by day
      ORDER BY day asc
    `;

    const usersRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      WITH analytics_users as (
        SELECT  v."visitorId", date_trunc('day', v."createdAt") as day
        FROM public.visitor as v
        Where  v."createdAt" > current_date - interval '180 days' and "propertyId" = ${property.id}
        Group by v."visitorId", day
        ORDER BY day desc
      )
    
      SELECT day, count(*)
      FROM analytics_users as l
      Group by day
      ORDER BY day asc
    `;

    let resObj = {
      id: property.id,
      visitsRaw: visitsRaw && visitsRaw.length ? visitsRaw : [],
      leadsRaw: leadsRaw && leadsRaw.length ? leadsRaw : [],
      usersRaw: usersRaw && usersRaw.length ? usersRaw : [],
    };

    return resObj;
  } catch (e) {
    throw new ApolloError("Error getting propertyAnalytics");
  }
};

export const analytics = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const user = await findUser(ctx, userUuid);

  try {
    const visitsRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      SELECT date_trunc('day', v."createdAt") as day, count(*)
      FROM public.visitor as v
      inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
      Where  v."createdAt" > current_date - interval '180 days'
      Group by day
      ORDER BY day asc
    `;

    const leadsRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      SELECT date_trunc('day', l."createdAt") as day, count(*)
      FROM public.lead as l
      inner join public.property as p on p.id = l."propertyId" and p."userId" = ${user.id}
      Where  l."createdAt" > current_date - interval '180 days'
      Group by day
      ORDER BY day asc
    `;

    const usersRaw = await ctx.prisma.$queryRaw<RawAnalytic[]>`
      WITH analytics_users as (
        SELECT  v."visitorId", date_trunc('day', v."createdAt") as day
        FROM public.visitor as v
        inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
        Where  v."createdAt" > current_date - interval '180 days'
        Group by v."visitorId", day
        ORDER BY day desc
      )
    
      SELECT day, count(*)
      FROM analytics_users as l
      Group by day
      ORDER BY day asc
    `;

    return {
      visitsRaw: visitsRaw && visitsRaw.length ? visitsRaw : [],
      leadsRaw: leadsRaw && leadsRaw.length ? leadsRaw : [],
      usersRaw: usersRaw && usersRaw.length ? usersRaw : [],
    };
  } catch (e) {
    throw new ApolloError("Error getting Analytics");
  }
};
