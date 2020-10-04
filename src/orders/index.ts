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
  const user = await findUser(ctx, userUuid);

  try {
    const orders = await ctx.prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (orders && orders.length > 1) {
      return orders.map((o) => {
        return {
          chargeId: o.chargeId,
          createdAt: o.createdAt,
          amountTotal: o.amountTotal,
          currency: o.currency,
          paid: o.paid,
          refunded: o.refunded,
          paymentType: o.paymentType,
          priceType: o.priceType,
          receiptUrl: o.receiptUrl,
          title: o.property?.title,
          uuid: o.property?.uuid,
          image: o.property?.mainPictureLowRes,
        };
      });
    }

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
    throw new ApolloError("Error getting property orders");
  }
};
