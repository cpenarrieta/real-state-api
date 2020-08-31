import { MyContext, UserArgs } from "../context";
import { AuthenticationError } from "apollo-server-express";

export const findUser = async (ctx: MyContext, uuid: string) => {
  const user = await ctx.prisma.user.findOne({
    where: {
      uuid,
    },
  });

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return user;
};

export const allUsers = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
  const users = await ctx.prisma.user.findMany({
    include: {
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return users;
};

export const verifyUser = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
  const uuid = ctx.req.user?.sub;

  if (!uuid) return false;

  await ctx.prisma.user.upsert({
    create: {
      uuid,
    },
    update: {
      uuid,
    },
    where: {
      uuid,
    },
  });

  return true;
};

export const me = async (parent: object, args: object, ctx: MyContext) => {
  const userUuid = ctx.req.user?.sub || "";

  const user = await findUser(ctx, userUuid);

  return user;
};

export const saveUser = async (
  parent: object,
  args: { user: UserArgs },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";

  let user = await findUser(ctx, userUuid);

  const { 
    email,
    firstName,
    lastName,
    phone,
    address,
    picture,
    address1,
    address2,
    city,
    province,
    zipCode,
    pictureLowRes,
    username,
  } = args?.user;

  user = await ctx.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      email,
      firstName,
      lastName,
      phone,
      address,
      picture,
      address1,
      address2,
      city,
      province,
      zipCode,
      pictureLowRes,
      username, // TODO verify uniqueness
    },
  });

  return user;
};
