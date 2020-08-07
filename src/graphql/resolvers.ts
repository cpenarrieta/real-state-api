import { MyContext } from "../context";

export const resolvers = {
  Query: {
    users: async (parent: object, args: object, ctx: MyContext) => {
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
    },
    properties: async (parent: object, args: object, ctx: MyContext) => {
      const properties = await ctx.prisma.property.findMany({});
      return properties;
    },
    me: async (parent: object, args: object, ctx: MyContext) => {
      return null;
    },
  },
  Mutation: {
    logout: async (parent: object, args: object, ctx: MyContext) => {
      return true;
    },
    saveProperty: async (parent: object, args: object, ctx: MyContext) => {
      return {};
    },
    verifyUser: async (parent: object, args: object, ctx: MyContext) => {
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
    },
  },
};
