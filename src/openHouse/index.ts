import { MyContext, OpenHouse } from "../context";
import { ApolloError, UserInputError } from "apollo-server-express";
import { findUser } from "../users";
import { findProperty } from "../properties";

export const propertyOpenHouse = async (
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
    const openHouse = await ctx.prisma.openHouse.findMany({
      where: {
        propertyId: property.id,
      },
      orderBy: {
        date: "asc",
      },
    });
    return openHouse;
  } catch (e) {
    throw new ApolloError("Error getting open house");
  }
};

export const saveOpenHouse = async (
  parent: object,
  args: { uuid: string; openHouse: OpenHouse[] },
  ctx: MyContext
) => {
  const userUuid = ctx.req.user?.sub || "";
  const propertyUuid = args?.uuid;
  const openHouse = args?.openHouse;

  const user = await findUser(ctx, userUuid);
  const property = await findProperty(ctx, propertyUuid);

  if (!property) {
    throw new UserInputError("Invalid Property");
  }

  if (property?.userId !== user.id) {
    throw new ApolloError("Property does not belongs to User");
  }

  try {
    const updateOpenHouse = openHouse.filter((o) => o.id && o.id > 0);
    const newOpenHouse = openHouse.filter((o) => o.id === -1);

    if (newOpenHouse && newOpenHouse.length > 0) {
      let str = `INSERT INTO public."openHouse" ("propertyId", date, "timeStart", "timeEnd") VALUES `;

      newOpenHouse.forEach((o) => {
        str += `(${property.id}, '${o.date}', '${o.start}', '${o.end}'),`;
      });
      str = str.substring(0, str.length - 1);
      str += ";";

      await ctx.prisma.$executeRaw(str);
    }
    if (updateOpenHouse && updateOpenHouse.length > 0) {
      const promises = updateOpenHouse.map((o) => {
        return ctx.prisma.$executeRaw(`
          UPDATE public."openHouse"
          SET date='${o.date}', "timeStart"='${o.start}', "timeEnd"='${o.end}'
          WHERE id = ${o.id};
        `);
      });
      await Promise.all(promises);
    }

    return true;
  } catch (e) {
    throw new ApolloError("Error saving open house");
  }
};
