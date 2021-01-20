import { MyContext } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser, findUserWithProperties } from "../users";
import { findProperty } from "../properties";

export const saveAttachment = async (
  parent: object,
  args: { url: string; title: string; uuid: string },
  ctx: MyContext
) => {
  const { url, title, uuid } = args;
  const userUuid = ctx.req.user?.sub || "";
  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, uuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  // TODO: CHECK max allowed attachments count
  try {
    await ctx.prisma.attachments.create({
      data: {
        title,
        url,
        property: {
          connect: {
            uuid,
          },
        },
      },
    });
    return true;
  } catch (e) {
    throw new ApolloError("Error saving Attachment");
  }
};

export const deleteAttachment = async (
  parent: object,
  args: { id: number },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const { id } = args;

  const user = await findUserWithProperties(ctx, userUuid);

  try {
    const attachment = await ctx.prisma.attachments.findUnique({
      where: {
        id,
      },
      select: {
        propertyId: true,
      },
    });

    const property = user.property.find((p) => {
      return p.id === attachment?.propertyId;
    });

    if (!property) {
      throw new ApolloError("Property does not belongs to User");
    }

    await ctx.prisma.attachments.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
    return true;
  } catch (e) {
    throw new ApolloError("Error deleting Attachment");
  }
};

export const propertyAttachments = async (
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
    const attachments = await ctx.prisma.attachments.findMany({
      where: {
        propertyId: property.id,
        active: true,
      },
      select: {
        id: true,
        url: true,
        title: true,
      },
    });
    return attachments;
  } catch (e) {
    throw new ApolloError("Error getting attachments");
  }
};
