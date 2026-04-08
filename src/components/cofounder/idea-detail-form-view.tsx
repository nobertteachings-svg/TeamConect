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
  showProtectedListingBadge: boolean;
  showTeamCompleteBadge: boolean;
};

function ReadonlyField({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-sm text-stone-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function ReadonlyTextareaBox({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-[5.5rem] whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

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
  showProtectedListingBadge,
  showTeamCompleteBadge,
}: Props) {
  const tIdea = await getTranslations({ locale, namespace: "startupIdea" });
  const tDetail = await getTranslations({ locale, namespace: "ideaDetail" });
  const tStages = await getTranslations({ locale, namespace: "startupStages" });

  const descriptionDisplay = stripRedundantTitleFromBody(description, title);
  const descriptionParagraphs = splitIdeaParagraphs(descriptionDisplay);
  const pitchParagraphs =
    pitch?.trim() ? splitIdeaParagraphs(stripRedundantTitleFromBody(pitch, title)) : [];

  const teaserText = publicTeaser?.trim() || teaserFallback;
  const ideaCountry = formatStoredCountry(ideaCountryCode);
  const postedCountry = formatStoredCountry(founderCountryCode);
  const namePart = founderName?.trim() || anonymousLabel;
  const postedBy = postedCountry ? `${namePart} · ${postedCountry}` : namePart;

  const slotsLine = isRecruiting
    ? tDetail("specSlotsProgress", {
        wanted: coFounderSlotsWanted,
        filled: filledMemberSlots,
        remaining: remainingSlots,
      })
    : tDetail("specSlotsComplete", { wanted: coFounderSlotsWanted, filled: filledMemberSlots });

  const descHint = canSeeFull
    ? isTeaserOnly
      ? tIdea("descriptionHintTeaser")
      : tIdea("descriptionHintPublic")
    : tIdea("descriptionHintTeaser");

  const pitchHint = canSeeFull
    ? isTeaserOnly
      ? tIdea("pitchHintTeaser")
      : tIdea("pitchHintPublic")
    : tIdea("pitchHintTeaser");

  return (
    <div className="mx-auto max-w-xl min-w-0 space-y-6">
      <div>
        <label className="tc-label">{tIdea("title")}</label>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <h1 className="px-3.5 py-3 text-xl font-bold leading-snug tracking-tight text-brand-green sm:text-2xl">
            {title}
          </h1>
          {(showProtectedListingBadge || showTeamCompleteBadge) && (
            <div className="flex flex-wrap gap-2 border-t border-stone-100 bg-stone-50/60 px-3.5 py-2.5">
              {showProtectedListingBadge ? (
                <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {tDetail("protectedListing")}
                </span>
              ) : null}
              {showTeamCompleteBadge ? (
                <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                  {tDetail("teamCompleteBadge")}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <fieldset className="tc-card-muted space-y-3 p-5">
        <legend className="mb-1 px-1 text-sm font-semibold text-stone-800">{tIdea("visibility")}</legend>
        <div
          className={`rounded-lg border p-3 transition ${
            protectionMode === "FULL_PUBLIC"
              ? "border-brand-green/40 bg-brand-green/[0.06] ring-1 ring-brand-green/15"
              : "border-stone-100 bg-stone-50/40 opacity-60"
          }`}
        >
          <p className="font-medium text-stone-900">{tIdea("fullPublic")}</p>
          <p className="mt-1 text-sm text-stone-600">{tIdea("fullPublicDesc")}</p>
        </div>
        <div
          className={`rounded-lg border p-3 transition ${
            protectionMode === "TEASER_ONLY"
              ? "border-amber-200/90 bg-amber-50/50 ring-1 ring-amber-200/60"
              : "border-stone-100 bg-stone-50/40 opacity-60"
          }`}
        >
          <p className="font-medium text-amber-950">{tIdea("teaserOnly")}</p>
          <p className="mt-1 text-sm text-stone-600">{tIdea("teaserOnlyDesc")}</p>
        </div>
      </fieldset>

      {isTeaserOnly ? (
        <div>
          <label className="tc-label">{tIdea("publicTeaser")}</label>
          <p className="tc-hint">{tIdea("publicTeaserHint")}</p>
          <ReadonlyTextareaBox>
            <FormattedIdeaParagraph text={teaserText} />
          </ReadonlyTextareaBox>
        </div>
      ) : null}

      <div>
        <label className="tc-label">{tIdea("description")}</label>
        <p className="tc-hint">{descHint}</p>
        {canSeeFull ? (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm sm:px-4 sm:py-4">
            {descriptionParagraphs.map((para, i) => (
              <FormattedIdeaParagraph key={i} text={para} />
            ))}
          </div>
        ) : (
          <ReadonlyTextareaBox className="border-dashed border-amber-200/80 bg-amber-50/30 text-sm text-amber-950">
            <p className="font-medium text-amber-950">{tDetail("teaserOnlyTitle")}</p>
            <p className="mt-2 leading-relaxed text-amber-900/90">{tDetail("descriptionLockedHint")}</p>
          </ReadonlyTextareaBox>
        )}
      </div>

      <div>
        <label className="tc-label">{tIdea("pitch")}</label>
        <p className="tc-hint">{pitchHint}</p>
        {canSeeFull ? (
          pitchParagraphs.length > 0 ? (
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm sm:px-4 sm:py-4">
              {pitchParagraphs.map((para, i) => (
                <FormattedIdeaParagraph key={i} text={para} />
              ))}
            </div>
          ) : (
            <ReadonlyField className="text-stone-500">{tDetail("pitchEmpty")}</ReadonlyField>
          )
        ) : (
          <ReadonlyTextareaBox className="border-dashed border-amber-200/80 bg-amber-50/30 text-sm text-amber-950">
            <p className="leading-relaxed text-amber-900/90">{tDetail("pitchLockedHint")}</p>
          </ReadonlyTextareaBox>
        )}
      </div>

      <div>
        <label className="tc-label">{tIdea("rolesNeeded")}</label>
        <p className="tc-hint">{tIdea("rolesHint")}</p>
        {rolesNeeded.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rolesNeeded.map((r) => (
              <span
                key={r}
                className="rounded-full border border-brand-green/30 bg-brand-green/[0.08] px-3.5 py-1.5 text-sm font-medium text-brand-green"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          <ReadonlyField className="text-stone-500">{tDetail("specEmpty")}</ReadonlyField>
        )}
      </div>

      <div>
        <label className="tc-label">{tIdea("coFounderSlotsLabel")}</label>
        <p className="tc-hint">{tIdea("coFounderSlotsHint")}</p>
        <ReadonlyField className="inline-block min-w-[5rem] tabular-nums font-medium">
          {coFounderSlotsWanted}
        </ReadonlyField>
        <p className="mt-2 text-xs text-stone-600">{slotsLine}</p>
      </div>

      <div>
        <label className="tc-label">{tIdea("industries")}</label>
        <ReadonlyField>
          {industries.length > 0 ? (
            <span className="break-words">{industries.join(", ")}</span>
          ) : (
            <span className="text-stone-500">{tDetail("specEmpty")}</span>
          )}
        </ReadonlyField>
      </div>

      <div>
        <label className="tc-label">{tIdea("country")}</label>
        <ReadonlyField>
          {ideaCountry ? (
            <span className="font-medium">{ideaCountry}</span>
          ) : (
            <span className="text-stone-500">{tDetail("specEmpty")}</span>
          )}
        </ReadonlyField>
      </div>

      <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 px-4 py-3 text-sm text-stone-700">
        <p>
          <span className="font-semibold text-stone-600">{tDetail("specStage")}:</span>{" "}
          <span className="font-medium text-stone-900">{tStages(stage)}</span>
        </p>
        <p className="mt-2">
          <span className="font-semibold text-stone-600">{tDetail("specPostedBy")}:</span>{" "}
          <span className="break-words font-medium text-stone-900">{postedBy}</span>
        </p>
      </div>
    </div>
  );
}
