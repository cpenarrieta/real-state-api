import { MyContext, LeadAnalytic, RawAnalytic } from "../context";
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
    // TODO: deal with timezones. new Date() here returns +7 hours

    const result = await ctx.prisma.$queryRaw<[LeadAnalytic]>`
      SELECT
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM public.visitor as v
      Where v."propertyId" = ${property.id} and v."createdAt" > current_date - interval '180 days';
    `;

    const resultLeads = await ctx.prisma.$queryRaw<[LeadAnalytic]>`
      SELECT
        SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM public.lead as l
      Where l."propertyId" = ${property.id} and l."createdAt" > current_date - interval '180 days';
    `;

    const resultUsers = await ctx.prisma.$queryRaw<[LeadAnalytic]>`
      WITH analytics_users as (
        SELECT  "visitorId", date_trunc('day', "createdAt") as day, count(*)
        FROM public.visitor
        where "propertyId" = ${property.id} and "createdAt" > current_date - interval '180 days'
        Group by "visitorId", day
        ORDER BY day desc
      )
      SELECT
        SUM(CASE WHEN v.day = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN v.day = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN v.day > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN v.day > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN v.day > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN v.day > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM analytics_users as v;
    `;

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
      Where  l.day > current_date - interval '7 days'
      Group by day
      ORDER BY day asc
    `;

    let resObj = {
      id: property.id,
      visits: result && result.length ? result[0] : null,
      leads: resultLeads && resultLeads.length ? resultLeads[0] : null,
      users: resultUsers && resultUsers.length ? resultUsers[0] : null,
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
    const resUsers = await ctx.prisma.$queryRaw<LeadAnalytic[]>`
      WITH analytics_users as (
        SELECT  v."visitorId", date_trunc('day', v."createdAt") as day, count(*)
        FROM public.visitor as v
        inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
        Where  v."createdAt" > current_date - interval '180 days'
        Group by v."visitorId", day
        ORDER BY day desc
      )

      SELECT
        SUM(CASE WHEN v.day = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN v.day = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN v.day > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN v.day > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN v.day > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN v.day > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM analytics_users as v
    `;

    const resSessions = await ctx.prisma.$queryRaw<LeadAnalytic[]>`
      SELECT
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN date_trunc('day', v."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN date_trunc('day', v."createdAt") > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM public.visitor as v
        inner join public.property as p on p.id = v."propertyId" and p."userId" = ${user.id}
      Where  v."createdAt" > current_date - interval '180 days'
    `;

    const resLeads = await ctx.prisma.$queryRaw<LeadAnalytic[]>`
      SELECT
        SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date THEN 1 ELSE 0 END) as "today",
        SUM(CASE WHEN date_trunc('day', l."createdAt") = current_date - interval '1 days' THEN 1 ELSE 0 END) as "yesterday",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '7 days' THEN 1 ELSE 0 END) as "last7Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '15 days' THEN 1 ELSE 0 END) as "last15Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '30 days' THEN 1 ELSE 0 END) as "last30Days",
        SUM(CASE WHEN date_trunc('day', l."createdAt") > current_date - interval '180 days' THEN 1 ELSE 0 END) as "last180Days",
        count(*) as "totalViews"
      FROM public.lead as l
        inner join public.property as p on p.id = l."propertyId" and p."userId" = ${user.id}
      Where  l."createdAt" > current_date - interval '180 days'
    `;

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
      Where  l.day > current_date - interval '7 days'
      Group by day
      ORDER BY day asc
    `;

    return {
      visits: resSessions && resSessions.length ? resSessions[0] : null,
      leads: resLeads && resLeads.length ? resLeads[0] : null,
      users: resUsers && resUsers.length ? resUsers[0] : null,
      visitsRaw: visitsRaw && visitsRaw.length ? visitsRaw : [],
      leadsRaw: leadsRaw && leadsRaw.length ? leadsRaw : [],
      usersRaw: usersRaw && usersRaw.length ? usersRaw : [],
    };
  } catch (e) {
    throw new ApolloError("Error getting Analytics");
  }
};
