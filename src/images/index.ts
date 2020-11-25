import { MyContext } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

export const propertyImages = async (
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
    const images = await ctx.prisma.images.findMany({
      where: {
        propertyId: property.id,
        active: true,
      },
      select: {
        id: true,
        url: true,
        urlLowRes: true,
        title: true,
        description: true,
        order: true,
      },
      orderBy: {
        order: "asc",
      },
    });
    return images;
  } catch (e) {
    throw new ApolloError("Error getting images");
  }
};

export const deleteImage = async (
  parent: object,
  args: { uuid: string; id: number },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const imageId = args?.id;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  try {
    await ctx.prisma.images.update({
      where: {
        id: imageId,
      },
      data: {
        active: false,
      },
    });
    return true;
  } catch (e) {
    throw new ApolloError("Error deleting images");
  }
};

export const savePropertyImages = async (
  parent: object,
  args: {
    uuid: string;
    images: [
      {
        title: string;
        description: string;
        url: string;
        urlLowRes: string;
      }
    ];
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const images = args?.images;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  const currentImages = await ctx.prisma.images.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        order: "desc",
      },
    ],
    take: 1,
  });

  let lastOrder = 0;
  if (currentImages && currentImages.length > 0) {
    lastOrder = currentImages[0].order || 0;
  }

  const promises = images.map((image, key) => {
    return ctx.prisma.images.create({
      data: {
        title: image.title,
        description: image.description,
        url: image.url,
        urlLowRes: image.urlLowRes,
        order: lastOrder + key + 1,
        property: {
          connect: {
            id: property.id,
          },
        },
      },
    });
  });

  try {
    const resImages = await Promise.all(promises);

    if (!property.mainPicture && images && images.length > 0) {
      const firstImage = resImages[0];

      await ctx.prisma.property.update({
        where: {
          id: property.id,
        },
        data: {
          images_imagesToproperty_mainImageId: {
            connect: {
              id: firstImage.id,
            },
          },
          mainPicture: firstImage.url,
          mainPictureLowRes: firstImage.urlLowRes,
        },
      });
    }

    return true;
  } catch (e) {
    throw new ApolloError("Error saving Property images");
  }
};

export const updateImagesOrder = async (
  parent: object,
  args: {
    uuid: string;
    images: [
      {
        id: number;
        order: number;
      }
    ];
  },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const images = args?.images;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  const promises = images.map((image, key) => {
    return ctx.prisma.images.update({
      where: {
        id: image.id,
      },
      data: {
        order: image.order,
      },
    });
  });

  try {
    await Promise.all(promises);
    return true;
  } catch (e) {
    throw new ApolloError("Error saving Property images");
  }
};
