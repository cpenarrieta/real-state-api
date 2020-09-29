import { MyContext } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

export const orders = async (
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
    const orders = await ctx.prisma.order.findMany({
      where: {
        userId: user.id,
      },
      select: {
        chargeId: true,
        createdAt: true,
        amountTotal: true,
        currency: true,
        paid: true,
        refunded: true,
        paymentType: true,
        priceType: true,
        receiptUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return orders;
  } catch (e) {
    throw new ApolloError("Error getting orders");
  }
};

export const propertyOrders = async (
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
    const orders = await ctx.prisma.order.findMany({
      where: {
        propertyId: property.id,
      },
      select: {
        chargeId: true,
        createdAt: true,
        amountTotal: true,
        currency: true,
        paid: true,
        refunded: true,
        paymentType: true,
        priceType: true,
        receiptUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return orders;
  } catch (e) {
    throw new ApolloError("Error getting orders");
  }
};
