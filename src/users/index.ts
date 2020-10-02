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

export const findUserWithProperties = async (ctx: MyContext, uuid: string) => {
  const user = await ctx.prisma.user.findOne({
    where: {
      uuid,
    },
    include: {
      property: true,
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

  const user = await ctx.prisma.user.findOne({
    where: {
      uuid,
    },
    select: {
      uuid: true,
    },
  });

  if (user) return "existing";

  await ctx.prisma.user.create({
    data: {
      uuid,
    },
  });

  return "new";
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
    smallBio,
    country,
  } = args?.user;

  let data = {
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
    smallBio,
    country,
    profileComplete: true,
  } as object;

  let duplicateUsername = false;
  if (username && username !== user.username) {
    const checkUsernames = await ctx.prisma.user.findMany({
      where: {
        username: username,
        id: {
          not: user.id,
        },
      },
      select: {
        uuid: true,
      },
      take: 1,
    });

    if (checkUsernames && checkUsernames.length >= 1) {
      duplicateUsername = true;
    } else {
      data = { ...data, username };
    }
  }

  user = await ctx.prisma.user.update({
    where: {
      id: user.id,
    },
    data,
  });

  return { ...user, duplicateUsername };
};

export const completeOnboarding = async (
  parent: object,
  args: object,
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";

  const user = await findUser(ctx, userUuid);

  if (user.profileComplete) {
    await ctx.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        onboardingComplete: true,
      },
    });

    return true;
  }

  return false;
};
