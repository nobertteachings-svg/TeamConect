import { prisma } from "@/lib/prisma";

export type LandingStats = {
  activeIdeas: number;
  foundersJoined: number;
  teamsFormed: number;
  countriesRepresented: number;
};

const empty: LandingStats = {
  activeIdeas: 0,
  foundersJoined: 0,
  teamsFormed: 0,
  countriesRepresented: 0,
};

/**
 * Aggregate counts for the public landing page. Safe to call from Server Components;
 * failures return zeros so the page still renders.
 */
export async function getLandingStats(): Promise<LandingStats> {
  try {
    const [activeIdeas, foundersJoined, teamsFormed, userCountries, founderCountries, ideaCountries] =
      await Promise.all([
        prisma.startupIdea.count({
          where: { deletedAt: null, isPublic: true },
        }),
        prisma.founderProfile.count(),
        prisma.startupTeam.count(),
        prisma.user.findMany({
          where: { country: { not: null } },
          select: { country: true },
          distinct: ["country"],
        }),
        prisma.founderProfile.findMany({
          where: { country: { not: null } },
          select: { country: true },
          distinct: ["country"],
        }),
        prisma.startupIdea.findMany({
          where: { deletedAt: null, isPublic: true, country: { not: null } },
          select: { country: true },
          distinct: ["country"],
        }),
      ]);

    const countrySet = new Set<string>();
    for (const row of userCountries) {
      if (row.country) countrySet.add(row.country);
    }
    for (const row of founderCountries) {
      if (row.country) countrySet.add(row.country);
    }
    for (const row of ideaCountries) {
      if (row.country) countrySet.add(row.country);
    }

    return {
      activeIdeas,
      foundersJoined,
      teamsFormed,
      countriesRepresented: countrySet.size,
    };
  } catch (e) {
    console.error("[getLandingStats]", e);
    return { ...empty };
  }
}
