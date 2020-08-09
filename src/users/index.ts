import { MyContext } from "../context";
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
