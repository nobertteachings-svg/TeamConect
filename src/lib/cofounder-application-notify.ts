import * as Sentry from "@sentry/nextjs";
import {
  sendCoFounderApplicationAcceptedEmail,
  sendCoFounderApplicationRejectedEmail,
  sendCoFounderApplicationRevokedEmail,
  sendCoFounderApplicationSubmittedEmail,
  sendNewCoFounderApplicationEmail,
} from "@/lib/mail";
import { localeForUser } from "@/lib/locale-url";
import { createInAppNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamconect.com").replace(/\/$/, "");
}

async function safeSend(fn: () => Promise<void>, label: string) {
  try {
    await fn();
  } catch (err) {
    console.error(`[${label}]`, err);
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Emails + in-app alerts after an application status change (founder or admin).
 */
export async function notifyApplicationStatusOutcomes(params: {
  previousStatus: string;
  newStatus: string;
  applicantUserId: string;
  idea: { slug: string; title: string };
  teamId: string | null;
}): Promise<void> {
  const { previousStatus, newStatus, applicantUserId, idea, teamId } = params;
  if (previousStatus === newStatus) return;

  const applicant = await prisma.user.findUnique({
    where: { id: applicantUserId },
    select: { email: true, preferredLang: true },
  });
  const loc = localeForUser(applicant?.preferredLang);
  const base = siteBase();
  const ideaPublicUrl = `${base}/${loc}/cofounders/${idea.slug}`;
  const browseUrl = `${base}/${loc}/cofounders`;
  const to = applicant?.email?.trim();

  const teamWorkspaceUrl = teamId ? `${base}/${loc}/dashboard/teams/${teamId}` : null;

  if (newStatus === "accepted" && previousStatus !== "accepted") {
    if (to) {
      void safeSend(
        () =>
          sendCoFounderApplicationAcceptedEmail({
            to,
            ideaTitle: idea.title,
            teamWorkspaceUrl,
            ideaPublicUrl,
          }),
        "application-accepted-email"
      );
    }
    void createInAppNotification({
      userId: applicantUserId,
      type: "application_accepted",
      title: `You're in: ${idea.title}`,
      body: teamWorkspaceUrl
        ? "Open your team workspace to coordinate with your co-founder."
        : "The founder accepted your application.",
      link: teamWorkspaceUrl ?? ideaPublicUrl,
    });
  } else if (newStatus === "rejected" && previousStatus === "pending") {
    if (to) {
      void safeSend(
        () =>
          sendCoFounderApplicationRejectedEmail({
            to,
            ideaTitle: idea.title,
            browseIdeasUrl: browseUrl,
          }),
        "application-rejected-email"
      );
    }
    void createInAppNotification({
      userId: applicantUserId,
      type: "application_rejected",
      title: `Application update: ${idea.title}`,
      body: "The founder is not moving forward with your application right now.",
      link: browseUrl,
    });
  } else if (newStatus === "rejected" && previousStatus === "accepted") {
    if (to) {
      void safeSend(
        () =>
          sendCoFounderApplicationRevokedEmail({
            to,
            ideaTitle: idea.title,
            browseIdeasUrl: browseUrl,
          }),
        "application-revoked-email"
      );
    }
    void createInAppNotification({
      userId: applicantUserId,
      type: "application_revoked",
      title: `Removed from team: ${idea.title}`,
      body: "Your accepted status was changed. You no longer have access to this team workspace.",
      link: browseUrl,
    });
  }
}

/** After a successful POST /api/cofounder-applications — emails (Sentry on failure) + in-app for both parties. */
export async function notifyAfterCoFounderApplicationSubmitted(params: {
  founderUserId: string;
  founderPreferredLang: string | null | undefined;
  founderEmail: string | null | undefined;
  applicantUserId: string;
  applicantPreferredLang: string | null | undefined;
  applicantEmail: string | null | undefined;
  applicantLabel: string;
  ideaId: string;
  ideaTitle: string;
  ideaSlug: string;
}): Promise<void> {
  const fLoc = localeForUser(params.founderPreferredLang);
  const aLoc = localeForUser(params.applicantPreferredLang);
  const base = siteBase();

  void createInAppNotification({
    userId: params.founderUserId,
    type: "application_received",
    title: `New application: ${params.ideaTitle}`,
    body: `${params.applicantLabel} applied to join your idea.`,
    link: `/${fLoc}/dashboard/cofounders/${params.ideaId}`,
  });

  void createInAppNotification({
    userId: params.applicantUserId,
    type: "application_submitted",
    title: `Application sent: ${params.ideaTitle}`,
    body: "The founder has been notified. Check your email for a copy.",
    link: `/${aLoc}/cofounders/${params.ideaSlug}`,
  });

  const founderTo = params.founderEmail?.trim();
  if (founderTo) {
    void safeSend(
      () =>
        sendNewCoFounderApplicationEmail({
          to: founderTo,
          ideaTitle: params.ideaTitle,
          applicantLabel: params.applicantLabel,
          dashboardUrl: `${base}/${fLoc}/dashboard/cofounders/${params.ideaId}`,
          ideaPublicUrl: `${base}/${fLoc}/cofounders/${params.ideaSlug}`,
        }),
      "new-application-founder-email"
    );
  }

  const applicantTo = params.applicantEmail?.trim();
  if (applicantTo) {
    void safeSend(
      () =>
        sendCoFounderApplicationSubmittedEmail({
          to: applicantTo,
          ideaTitle: params.ideaTitle,
          ideaPublicUrl: `${base}/${aLoc}/cofounders/${params.ideaSlug}`,
          dashboardUrl: `${base}/${aLoc}/dashboard/cofounders`,
        }),
      "new-application-applicant-email"
    );
  }
}
