import prisma from "../context";
import { published_status, property_status } from "@prisma/client";
import { addYears, addDays, addMonths, compareDesc } from "date-fns";

const getAddFunc = (product: string) => {
  if (product === "year") {
    return addYears;
  } else {
    return addMonths;
  }
};

export const activateProperty = async (
  session: { metadata: { propertyId: string }; customer: string },
  product: string,
  userUuid: string
) => {
  const { propertyId } = session?.metadata;

  const property = await prisma.property.findOne({
    where: {
      uuid: propertyId,
    },
    select: {
      id: true,
      uuid: true,
      status: true,
      publishedStatus: true,
      webPaidUntil: true,
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  let newWebPaidUntil = null;
  const addFunc = getAddFunc(product);
  if (
    !property?.webPaidUntil ||
    compareDesc(property.webPaidUntil, new Date()) === 1
  ) {
    newWebPaidUntil = addDays(addFunc(new Date(), 1), 1);
  } else {
    newWebPaidUntil = addDays(addFunc(property.webPaidUntil, 1), 1);
  }

  await prisma.property.update({
    data: {
      webPaidUntil: newWebPaidUntil,
      publishedStatus: published_status.PUBLISHED,
      status:
        !property.status || property?.status === property_status.INACTIVE
          ? property_status.ACTIVE
          : property.status,
    },
    where: {
      uuid: propertyId,
    },
  });

  // if (userUuid) {
  //   await prisma.user.update({
  //     where: {
  //       uuid: userUuid,
  //     },
  //     data: {
  //       stripeId: session?.customer,
  //     },
  //   });
  // }

  // TODO: create Order
  //   ==== orders ====
  // id
  // userId
  // propertyId
  // sessionId
  // productId
  // paymentIntent
  // amountSubtotal: 500,
  // amountTotal: 500,
};
