import type { PrismaClient } from "@prisma/client";

const MAX_THREAD_DEPTH = 8;

/** Depth from root (root = 1). Returns -1 if missing or cycle. */
export async function getTeamPostDepth(
  prisma: Pick<PrismaClient, "teamPost">,
  postId: string
): Promise<number> {
  let depth = 1;
  let cur = await prisma.teamPost.findUnique({
    where: { id: postId },
    select: { parentId: true },
  });
  if (!cur) return -1;
  while (cur.parentId) {
    depth++;
    if (depth > 40) return -1;
    cur = await prisma.teamPost.findUnique({
      where: { id: cur.parentId },
      select: { parentId: true },
    });
    if (!cur) return -1;
  }
  return depth;
}

export function maxThreadDepth(): number {
  return MAX_THREAD_DEPTH;
}

/** New reply would be at parentDepth + 1; allowed only if parentDepth < MAX_THREAD_DEPTH. */
export async function canAddReply(
  prisma: Pick<PrismaClient, "teamPost">,
  parentId: string
): Promise<boolean> {
  const d = await getTeamPostDepth(prisma, parentId);
  return d >= 1 && d < MAX_THREAD_DEPTH;
}
