import { MyContext } from "../context";

export const resolvers = {
  Query: {
    users: async (parent: object, args: object, ctx: MyContext) => {
      const users = await ctx.prisma.user.findMany({
        include: {
          properties: {
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
  },
};
