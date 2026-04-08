import { prisma } from "@/lib/prisma";

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  /** Path starting with / and locale, e.g. /en/dashboard/cofounders/xyz */
  link?: string | null;
};

/** Best-effort in-app notification; never throws to callers. */
export async function createInAppNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title.slice(0, 200),
        body: input.body?.slice(0, 8000) ?? null,
        link: input.link?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("[createInAppNotification]", e);
  }
}
