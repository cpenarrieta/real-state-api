import prisma from '../context'
// import { compareAsc, addDays, format } from "date-fns";

export const activateProperty = async (propertyId: string, product: string) => {
  const property = await prisma.property.findOne({
    where: {
      uuid: propertyId
    }
  })

  console.log(property?.uuid)
  // TODO: update property date
}