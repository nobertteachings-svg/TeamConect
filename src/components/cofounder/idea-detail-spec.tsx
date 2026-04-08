import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { formatStoredCountry } from "@/lib/countries";

type Props = {
  locale: string;
  protectionMode: "FULL_PUBLIC" | "TEASER_ONLY";
  stage: "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED";
  rolesNeeded: string[];
  coFounderSlotsWanted: number;
  filledMemberSlots: number;
  remainingSlots: number;
  isRecruiting: boolean;
  industries: string[];
  ideaCountryCode: string | null;
  founderName: string | null;
  founderCountryCode: string | null;
  anonymousLabel: string;
};

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-stone-100 py-3 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-6 sm:py-3.5">
      <div className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="min-w-0 text-sm leading-relaxed text-stone-800">{children}</div>
    </div>
  );
}

export async function IdeaDetailSpec({
  locale,
  protectionMode,
  stage,
  rolesNeeded,
  coFounderSlotsWanted,
  filledMemberSlots,
  remainingSlots,
  isRecruiting,
  industries,
  ideaCountryCode,
  founderName,
  founderCountryCode,
  anonymousLabel,
}: Props) {
  const t = await getTranslations({ locale, namespace: "ideaDetail" });
  const tStages = await getTranslations({ locale, namespace: "startupStages" });

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

  return (
    <section
      className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm"
      aria-labelledby="idea-spec-heading"
    >
      <h2
        id="idea-spec-heading"
        className="border-b border-stone-200/80 bg-gradient-to-r from-stone-50 to-white px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-600"
      >
        {t("specHeading")}
      </h2>
      <div className="px-4 sm:px-5">
        <SpecRow label={t("specVisibility")}>
          {protectionMode === "TEASER_ONLY" ? (
            <div>
              <p className="font-semibold text-amber-900">{t("specVisibilityProtected")}</p>
              <p className="mt-1 text-xs text-stone-600">{t("specVisibilityProtectedHint")}</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-stone-900">{t("specVisibilityPublic")}</p>
              <p className="mt-1 text-xs text-stone-600">{t("specVisibilityPublicHint")}</p>
            </div>
          )}
        </SpecRow>
        <SpecRow label={t("specStage")}>
          <span className="font-medium">{tStages(stage)}</span>
        </SpecRow>
        <SpecRow label={t("specRoles")}>
          {rolesNeeded.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {rolesNeeded.map((r) => (
                <li
                  key={r}
                  className="rounded-lg border border-brand-green/25 bg-brand-green/[0.08] px-2.5 py-1 text-xs font-semibold text-brand-green"
                >
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-stone-500">{t("specEmpty")}</span>
          )}
        </SpecRow>
        <SpecRow label={t("specCofounderSlots")}>
          <div>
            <p className="font-medium tabular-nums">{slotsLine}</p>
            <p className="mt-1 text-xs text-stone-600">{t("specCofounderSlotsHint")}</p>
          </div>
        </SpecRow>
        <SpecRow label={t("specIndustries")}>
          {industries.length > 0 ? (
            <span className="break-words">{industries.join(", ")}</span>
          ) : (
            <span className="text-stone-500">{t("specEmpty")}</span>
          )}
        </SpecRow>
        <SpecRow label={t("specIdeaCountry")}>
          {ideaCountry ? (
            <span className="font-medium">{ideaCountry}</span>
          ) : (
            <span className="text-stone-500">{t("specEmpty")}</span>
          )}
        </SpecRow>
        <SpecRow label={t("specPostedBy")}>
          <span className="break-words font-medium">{postedBy}</span>
        </SpecRow>
      </div>
    </section>
  );
}
