import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await prisma.event.upsert({
    where: { slug: "monthly-webinar-mar-2025" },
    create: {
      title: "Monthly Remote Tech Webinar",
      slug: "monthly-webinar-mar-2025",
      description: "Connect with builders and leaders from around the world",
      type: "webinar",
      startAt: nextMonth,
      endAt: new Date(nextMonth.getTime() + 2 * 60 * 60 * 1000),
      timezone: "Africa/Nairobi",
      isVirtual: true,
      meetingUrl: "https://meet.example.com/teamconect",
    },
    update: {},
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
