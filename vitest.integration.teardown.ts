/**
 * Single disconnect after all integration files (avoids closing the shared client mid-run).
 */
export default async function integrationTeardown() {
  if (process.env.VITEST_SKIP_DB_INTEGRATION) return;
  try {
    const { prisma } = await import("./src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    // Prisma may never have been imported if the suite was empty
  }
}
