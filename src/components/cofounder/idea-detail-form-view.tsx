import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { FormattedIdeaParagraph } from "@/components/cofounder/formatted-idea-paragraph";
import { formatStoredCountry } from "@/lib/countries";
import { splitIdeaParagraphs, stripRedundantTitleFromBody } from "@/lib/idea-display";

type Props = {
  locale: string;
  title: string;
  protectionMode: "FULL_PUBLIC" | "TEASER_ONLY";
  publicTeaser: string | null;
  description: string;
  pitch: string | null;
  canSeeFull: boolean;
  isTeaserOnly: boolean;
  teaserFallback: string;
  rolesNeeded: string[];
  coFounderSlotsWanted: number;
  filledMemberSlots: number;
  remainingSlots: number;
  isRecruiting: boolean;
  industries: string[];
  ideaCountryCode: string | null;
  stage: "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED";
  founderName: string | null;
  founderCountryCode: string | null;
  anonymousLabel: string;
  showTeamCompleteBadge: boolean;
};

/** Muted section heading — smaller than page title, clear hierarchy */
function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500"
    >
      {children}
    </h2>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-base leading-[1.7] text-stone-700">{children}</div>;
}

/** Public idea page: hero → teaser (if protected) → about → looking for → details sidebar */
export async function IdeaDetailFormView({
  locale,
  title,
  protectionMode,
  publicTeaser,
  description,
  pitch,
  canSeeFull,
  isTeaserOnly,
  teaserFallback,
  rolesNeeded,
  coFounderSlotsWanted,
  filledMemberSlots,
  remainingSlots,
  isRecruiting,
  industries,
  ideaCountryCode,
  stage,
  founderName,
  founderCountryCode,
  anonymousLabel,
  showTeamCompleteBadge,
}: Props) {
  const t = await getTranslations({ locale, namespace: "ideaDetail" });
  const tStages = await getTranslations({ locale, namespace: "startupStages" });

  const descriptionDisplay = stripRedundantTitleFromBody(description, title);
  const descriptionParagraphs = splitIdeaParagraphs(descriptionDisplay);
  const pitchParagraphs =
    pitch?.trim() ? splitIdeaParagraphs(stripRedundantTitleFromBody(pitch, title)) : [];
  const hasPitchContent = canSeeFull && pitchParagraphs.length > 0;

  const teaserText = publicTeaser?.trim() || teaserFallback;
  const ideaCountry = formatStoredCountry(ideaCountryCode);
  const postedCountry = formatStoredCountry(founderCountryCode);
  const namePart = founderName?.trim() || anonymousLabel;
  const postedBy = postedCountry ? `${namePart} · ${postedCountry}` : namePart;

  const slotsLine = isRecruiting
    ? t("specSlotsProgress", {
        wanted: coFounderSlotsWanted,
        filled: filledMemberSlots,
        remaining: remainingSlots,
      })
    : t("specSlotsComplete", { wanted: coFounderSlotsWanted, filled: filledMemberSlots });

  const visibilityLabel =
    protectionMode === "TEASER_ONLY" ? t("badgeVisibilityTeaser") : t("badgeVisibilityPublic");

  return (
    <article className="mx-auto min-w-0 max-w-5xl">
      {/* Hero: title + visibility + stage + team status */}
      <header className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-stone-50/80 to-stone-100/40 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <h1 className="text-balance text-3xl font-bold leading-[1.12] tracking-tight text-brand-green sm:text-4xl lg:text-[2.35rem]">
          {title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
              protectionMode === "TEASER_ONLY"
                ? "border-amber-200/90 bg-amber-50 text-amber-950"
                : "border-brand-green/35 bg-brand-green/[0.09] text-brand-green"
            }`}
          >
            {visibilityLabel}
          </span>
          {showTeamCompleteBadge ? (
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
              {t("teamCompleteBadge")}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-stone-600">
          <span className="font-semibold text-stone-700">{t("heroMetaStage")}:</span>{" "}
          <span className="text-stone-800">{tStages(stage)}</span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-14 lg:items-start">
        <div className="min-w-0 space-y-14">
          {isTeaserOnly ? (
            <section aria-labelledby="idea-teaser-heading">
              <SectionHeading id="idea-teaser-heading">{t("publicTeaser")}</SectionHeading>
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/35 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
                <Prose>
                  <FormattedIdeaParagraph text={teaserText} />
                </Prose>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="idea-about-heading">
            <SectionHeading id="idea-about-heading">{t("pageAboutTitle")}</SectionHeading>
            {canSeeFull ? (
              <div className="rounded-2xl border border-stone-200/90 bg-white px-5 py-6 shadow-tc sm:px-7 sm:py-8">
                <Prose>
                  {descriptionParagraphs.map((para, i) => (
                    <FormattedIdeaParagraph key={i} text={para} />
                  ))}
                </Prose>
                {hasPitchContent ? (
                  <>
                    <div className="my-8 border-t border-stone-100" aria-hidden />
                    <h3 className="mb-4 text-sm font-semibold text-stone-800">{t("pitch")}</h3>
                    <Prose>
                      {pitchParagraphs.map((para, i) => (
                        <FormattedIdeaParagraph key={i} text={para} />
                      ))}
                    </Prose>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200/90 bg-amber-50/45 px-5 py-6 sm:px-7 sm:py-7">
                <p className="text-sm font-semibold text-amber-950">{t("teaserOnlyTitle")}</p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900/95">{t("aboutLockedCallout")}</p>
              </div>
            )}
          </section>

          <section aria-labelledby="idea-looking-heading">
            <SectionHeading id="idea-looking-heading">{t("pageLookingTitle")}</SectionHeading>
            <div className="rounded-2xl border border-stone-200/90 bg-white px-5 py-6 shadow-tc sm:px-7 sm:py-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                {t("lookingForRolesCaption")}
              </p>
              {rolesNeeded.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("specRoles")}>
                  {rolesNeeded.map((r) => (
                    <li
                      key={r}
                      className="rounded-full border border-brand-green/35 bg-brand-green/[0.08] px-3.5 py-1.5 text-sm font-medium text-brand-green"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-stone-500">{t("specEmpty")}</p>
              )}

              <div className="mt-8 border-t border-stone-100 pt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {t("lookingForSlotsCaption")}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand-green">
                  {coFounderSlotsWanted}
                </p>
                <p className="mt-1 text-sm text-stone-600">{t("specCofounderSlots")}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{slotsLine}</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">{t("specCofounderSlotsHint")}</p>
              </div>
            </div>
          </section>
        </div>

        <aside
          className="min-w-0 lg:sticky lg:top-24"
          aria-labelledby="idea-details-heading"
        >
          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/95 to-white p-5 shadow-tc sm:p-6">
            <SectionHeading id="idea-details-heading">{t("pageDetailsTitle")}</SectionHeading>

            <dl className="space-y-6">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {t("specIndustries")}
                </dt>
                <dd className="mt-2">
                  {industries.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {industries.map((ind) => (
                        <li
                          key={ind}
                          className="rounded-full border border-brand-teal/30 bg-brand-teal/[0.08] px-3 py-1.5 text-xs font-medium text-brand-teal sm:text-sm"
                        >
                          {ind}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-stone-500">{t("specEmpty")}</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {t("specIdeaCountry")}
                </dt>
                <dd className="mt-2 text-sm font-medium leading-relaxed text-stone-900">
                  {ideaCountry ?? t("specEmpty")}
                </dd>
              </div>

              <div className="border-t border-stone-200/80 pt-6">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {t("specPostedBy")}
                </dt>
                <dd className="mt-2 break-words text-sm font-medium leading-relaxed text-stone-800">
                  {postedBy}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}
