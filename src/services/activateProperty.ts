import prisma from "../context";
import { published_status, property_status } from "@prisma/client";
import { addDays, compareDesc } from "date-fns";
import { PRICE_MAP } from "../priceUtil";

const getDaysByProduct = (type: string) => {
  if (type === "year") {
    return 366;
  } else if (type === "month") {
    return 32;
  } else if (type === "lifetime") {
    return 999999;
  }
  // TODO something is wrong here
  return 32;
};

export const activateProperty = async (session: {
  id: string;
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  captured: boolean;
  disputed: boolean;
  refunded: boolean;
  paid: boolean;
  payment_intent: string;
  payment_method: string;
  currency: string;
  receipt_email: string;
  receipt_url: string;
  metadata: { propertyId: string; priceId: string; userUuid: string };
  billing_details: {
    email: string;
    name: string;
    address: {
      country: string;
      postal_code: string;
    };
  };
  payment_method_details: {
    type: string;
  };
  customer: string;
  status: string;
}) => {
  const { propertyId, priceId, userUuid } = session?.metadata;
  const price = PRICE_MAP[priceId];

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
      userId: true,
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  let newWebPaidUntil = null;
  const freeDays = 30;
  const productDays = getDaysByProduct(price.type);
  if (
    !property?.webPaidUntil ||
    compareDesc(property.webPaidUntil, new Date()) === 1
  ) {
    newWebPaidUntil = addDays(new Date(), productDays + freeDays);
  } else {
    addDays(property.webPaidUntil, productDays + freeDays);
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

  if (userUuid) {
    await prisma.user.update({
      where: {
        uuid: userUuid,
      },
      data: {
        stripeId: session?.customer,
      },
    });
  }

  try {
    if (!session) return;

    await prisma.order.upsert({
      where: {
        chargeId: session.id,
      },
      create: {
        chargeId: session.id,
        paymentIntentId: session.payment_intent,
        customerId: session.customer,
        priceId: priceId,
        priceType: price.type,
        priceCountry: price.country,
        amountTotal: session.amount,
        paid: session.paid,
        refunded: session.refunded,
        receiptUrl: session.receipt_url,
        paymentType: session.payment_method_details?.type,
        currency: session.currency,
        status: session.status,
        billingCountry: session.billing_details?.address?.country,
        billingPostal: session.billing_details?.address?.postal_code,
        billingEmail: session.billing_details?.email,
        billingName: session.billing_details?.name,
        paymentMethod: session.payment_method,
        property: {
          connect: {
            uuid: propertyId,
          },
        },
        user: {
          connect: {
            id: property.userId,
          },
        },
      },
      update: {
        chargeId: session.id,
        paymentIntentId: session.payment_intent,
        customerId: session.customer,
        priceId: priceId,
        priceType: price.type,
        priceCountry: price.country,
        amountTotal: session.amount,
        paid: session.paid,
        refunded: session.refunded,
        receiptUrl: session.receipt_url,
        paymentType: session.payment_method_details?.type,
        currency: session.currency,
        status: session.status,
        billingCountry: session.billing_details?.address?.country,
        billingPostal: session.billing_details?.address?.postal_code,
        billingEmail: session.billing_details?.email,
        billingName: session.billing_details?.name,
        paymentMethod: session.payment_method,
        property: {
          connect: {
            uuid: propertyId,
          },
        },
        user: {
          connect: {
            id: property.userId,
          },
        },
      },
    });
  } catch {
    // TODO: report bugsnag
  }
};
