import { prisma } from "@/lib/prisma";
import {
  cacheGet,
  cacheSet,
  cacheKey,
  getCacheTtl,
} from "./redis";

/** Revive ISO date strings to Date objects for display */
function reviveDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates) as T;
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (
        typeof v === "string" &&
        (k.endsWith("At") || k.endsWith("Date") || k === "expires") &&
        /^\d{4}-\d{2}-\d{2}T/.test(v)
      ) {
        out[k] = new Date(v);
      } else {
        out[k] = reviveDates(v);
      }
    }
    return out as T;
  }
  return obj;
}

const PAGE_SIZE = 20;

export async function getCachedEvents() {
  const key = cacheKey("events", {});
  const cached = await cacheGet<unknown>(key);
  if (cached) return reviveDates(cached) as Awaited<ReturnType<typeof fetchEvents>>;

  const data = await fetchEvents();
  await cacheSet(key, data as object, getCacheTtl("events"));
  return data;
}

async function fetchEvents() {
  return prisma.event.findMany({
    where: { startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });
}

async function fetchIdeasPage(
  filters: { country?: string; stage?: string; role?: string },
  cursor?: string | null
) {
  const where: Record<string, unknown> = {
    isPublic: true,
    status: "recruiting",
    deletedAt: null,
  };
  if (filters.country) where.country = filters.country;
  if (filters.stage) where.stage = filters.stage;
  if (filters.role) where.rolesNeeded = { has: filters.role };

  const take = PAGE_SIZE + 1;
  const ideas = await prisma.startupIdea.findMany({
    where,
    include: {
      founder: { include: { user: { select: { name: true, country: true } } } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = ideas.length > PAGE_SIZE;
  const items = hasMore ? ideas.slice(0, PAGE_SIZE) : ideas;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;
  return { ideas: items, nextCursor };
}

export type IdeasResult = Awaited<ReturnType<typeof fetchIdeasPage>>;

export async function getCachedIdeas(
  filters: { country?: string; stage?: string; role?: string },
  cursor?: string | null
): Promise<IdeasResult> {
  const cacheable = !cursor;
  if (cacheable) {
    const key = cacheKey("ideas", {
      c: filters.country ?? "",
      s: filters.stage ?? "",
      r: filters.role ?? "",
    });
    const cached = await cacheGet<IdeasResult>(key);
    if (cached) return reviveDates(cached) as IdeasResult;
  }

  const data = await fetchIdeasPage(filters, cursor);
  if (cacheable) {
    const key = cacheKey("ideas", {
      c: filters.country ?? "",
      s: filters.stage ?? "",
      r: filters.role ?? "",
    });
    await cacheSet(key, data as object, getCacheTtl("ideas"));
  }
  return data;
}
