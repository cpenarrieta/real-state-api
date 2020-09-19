import { MyContext } from "../context";
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
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
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
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const id = args?.id;
  const leadStatus = args?.leadStatus;

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
      },
    });

    return true;
  } catch (e) {
    throw new ApolloError("Error updating leads");
  }
};
