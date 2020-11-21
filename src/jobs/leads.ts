import cron from "cron";
import prisma from "../context";
import { makeANiceEmail, transport } from "../services/leadMail";
import { format } from "date-fns";

const CronJob = cron.CronJob;

async function asyncForEach(
  array: object[],
  callback: (element: {
    userId?: number;
    firstName?: string;
    email?: string;
    leads?: {
      name?: string;
      email?: string;
      phone?: string;
      property?: string;
    }[];
  }) => void
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index]);
  }
}

export const scheduleLeadsJob = () => {
  const job = new CronJob(
    "0 */30 7-23 * * *", // Every 30 minutes between 7am-11pm
    // "0 */1 * * * *",
    async () => {
      try {
        // Get leads that didnt sent email(new column) and that are not contacted.
        const leads = await prisma.lead.findMany({
          where: {
            mailStattus: {
              equals: false,
            },
          },
          include: {
            user: {
              select: {
                firstName: true,
                uuid: true,
                email: true,
                username: true,
              },
            },
            property: {
              select: {
                address1: true,
                title: true,
              },
            },
          },
          orderBy: {
            userId: "desc",
          },
        });

        if (leads.length > 0) {
          const leadsByUser: {
            [key: string]: {
              userId?: number;
              firstName?: string;
              email?: string;
              leads?: {
                name?: string;
                email?: string;
                phone?: string;
                property?: string;
              }[];
            };
          } = {};

          // GROUP By User
          leads.forEach((lead) => {
            let leadUser = leadsByUser[lead.user?.uuid || ""];

            if (!leadUser) {
              leadsByUser[lead.user?.uuid || ""] = {
                userId: lead.userId || 0,
                firstName: lead.user?.firstName || "",
                email: lead.user?.email || "",
                leads: [],
              };
            }

            leadsByUser[lead.user?.uuid || ""].leads?.push({
              name: lead.name || "",
              email: lead.email || "",
              phone: lead.phone || "",
              property: lead.property?.address1 || "Agent Website",
            });
          });

          // SEND EMAILS
          asyncForEach(
            Object.keys(leadsByUser).map((m) => leadsByUser[m]),
            async (element) => {
              try {
                if (element.leads && element.leads?.length) {
                  await transport.sendMail({
                    from: "hello@realtorapp.co",
                    to: element.email,
                    subject: `🔎 Realtor App | New Leads | ${format(new Date(), "MMMM do")}`,
                    html: makeANiceEmail(element.leads),
                  });
                }
              } catch (e) {
                // REPORT email error
                console.log(e);
              }
            }
          );

          // UPDATE leads mailStatus to true
          const leadIds = leads.map((l) => l.id).join(",");

          await prisma.$executeRaw(`
            Update public.lead Set "mailStattus"=true
            Where id in (${leadIds})
          `);

          // send email to me confirming emails sent and with report
          console.log("leads sent", leads.length, " ||| ", leadIds);
        } else {
          // no leads to send
        }
      } catch (e) {
        // REPORT ERROR
      }
    },
    () => {
      console.log("on Complete");
    },
    true
  );
  job.start();
};
