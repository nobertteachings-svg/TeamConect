import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommunityEventForm } from "@/components/community/community-event-form";
import { getCurrentUser } from "@/lib/auth";
import { getCachedEvents } from "@/lib/cached-data";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const events = await getCachedEvents();
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-brand-green sm:text-4xl">{t("community.title")}</h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">{t("community.subtitle")}</p>
        </div>

        <div className="mb-14">
          <CommunityEventForm isSignedIn={Boolean(user?.id)} />
        </div>

        <section>
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            {t("community.upcomingEvents")}
          </h2>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-stone-600">{t("community.noEvents")}</p>
            ) : (
              events.map((e) => {
                const by =
                  e.author?.name?.trim() ||
                  e.author?.email?.trim() ||
                  t("community.eventPostedByCommunity");
                return (
                  <article key={e.id} className="tc-card p-5 transition hover:shadow-tc-md">
                    <h3 className="font-semibold text-stone-900">{e.title}</h3>
                    <p className="mt-1 text-sm font-medium capitalize text-brand-teal">
                      {e.type.replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{e.description}</p>
                    <p className="mt-2 text-xs font-medium text-stone-500">
                      {e.startAt.toLocaleString(locale === "zh" ? "zh-CN" : locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {e.isVirtual ? tCommon("virtual") : tCommon("inPerson")}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {t("community.eventPostedBy", { name: by })}
                    </p>
                    {e.meetingUrl && (
                      <a
                        href={e.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-brand-teal hover:underline"
                      >
                        {t("community.eventLink")}
                      </a>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
