"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AdminEvents } from "@/components/admin/admin-events";

type Tab = "overview" | "users" | "ideas" | "applications" | "waitlist" | "community" | "audit";

const USER_ROLES = ["FOUNDER", "INVESTOR", "MENTOR", "ADMIN"] as const;

export function AdminConsole() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-xl border border-stone-200/80 bg-stone-100/70 p-1.5 shadow-inner">
        {(
          [
            ["overview", t("tabOverview")],
            ["users", t("tabUsers")],
            ["ideas", t("tabIdeas")],
            ["applications", t("tabApplications")],
            ["waitlist", t("tabWaitlist")],
            ["community", t("tabCommunity")],
            ["audit", t("tabAudit")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === id
                ? "bg-white text-brand-green shadow-sm ring-1 ring-stone-200/80"
                : "text-stone-600 hover:bg-white/60 hover:text-stone-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewSection t={t} tCommon={tCommon} />}
      {tab === "users" && <UsersSection t={t} tCommon={tCommon} locale={locale} />}
      {tab === "ideas" && <IdeasSection t={t} tCommon={tCommon} locale={locale} />}
      {tab === "applications" && <ApplicationsSection t={t} />}
      {tab === "waitlist" && <WaitlistSection t={t} />}
      {tab === "community" && <CommunitySection t={t} />}
      {tab === "audit" && <AuditSection t={t} />}
    </div>
  );
}

function OverviewSection({ t, tCommon }: { t: (key: string) => string; tCommon: (key: string) => string }) {
  const [data, setData] = useState<{
    totals: Record<string, number>;
    last7Days: Record<string, number>;
    topCountries: { country: string | null; count: number }[];
    topLanguages: { language: string; count: number }[];
    health: { email: boolean; redis: boolean; databaseUrl: boolean };
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-stone-600">{tCommon("loading")}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("users")} total={data.totals.users} week={data.last7Days.users} />
        <StatCard label={t("ideas")} total={data.totals.ideas} week={data.last7Days.ideas} />
        <StatCard label={t("applicationsLabel")} total={data.totals.applications} week={data.last7Days.applications} />
        <StatCard label={t("waitlist")} total={data.totals.waitlist} week={data.last7Days.waitlist} />
      </div>
      <div className="tc-card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">{t("healthTitle")}</h3>
        <ul className="text-sm text-stone-600 space-y-1">
          <li>{t("healthDatabase")}: {data.health.databaseUrl ? t("healthOk") : t("healthMissing")}</li>
          <li>{t("healthRedis")}: {data.health.redis ? t("healthOk") : t("healthOptional")}</li>
          <li>{t("healthEmail")}: {data.health.email ? t("healthOk") : t("healthOptional")}</li>
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="tc-card p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">{t("topCountries")}</h3>
          <ul className="text-sm text-stone-600 space-y-1">
            {data.topCountries.map((r) => (
              <li key={String(r.country)}>
                {r.country ?? "—"}: {r.count}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="font-medium mb-2">{t("topLanguages")}</h3>
          <ul className="text-sm text-stone-600 space-y-1">
            {data.topLanguages.map((r) => (
              <li key={r.language}>
                {r.language}: {r.count}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, total, week }: { label: string; total: number; week: number }) {
  const t = useTranslations("admin");
  return (
    <div className="tc-card p-5 transition hover:shadow-tc-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 bg-gradient-to-br from-brand-green to-brand-teal bg-clip-text text-3xl font-bold tabular-nums text-transparent">
        {total}
      </p>
      <p className="text-xs text-stone-500 mt-1">
        {t("last7Days")}: +{week}
      </p>
    </div>
  );
}

function UsersSection({
  t,
  tCommon,
  locale,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
  locale: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{
    id: string;
    roles: string[];
    accountDisabled: boolean;
    founderProfile: { verified: boolean } | null;
  } | null>(null);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q });
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.users ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchUsers")}
          className="tc-input min-w-[200px] max-w-xs"
        />
        <button type="button" onClick={() => { setPage(1); load(); }} className="tc-btn-secondary">
          {t("search")}
        </button>
      </div>
      {loading ? (
        <p>{tCommon("loading")}</p>
      ) : (
        <>
          <div className="tc-table-shell overflow-x-auto">
            <table className="tc-table">
              <thead className="tc-table-head">
                <tr>
                  <th className="tc-table-th">{t("email")}</th>
                  <th className="tc-table-th">{t("roles")}</th>
                  <th className="tc-table-th">{t("country")}</th>
                  <th className="tc-table-th">{t("lang")}</th>
                  <th className="tc-table-th">{t("disabled")}</th>
                  <th className="tc-table-th">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const user = u as {
                    id: string;
                    email: string | null;
                    roles: string[];
                    country: string | null;
                    preferredLang: string;
                    accountDisabled: boolean;
                    accounts: { provider: string }[];
                    founderProfile: { verified: boolean } | null;
                  };
                  return (
                    <tr key={user.id}>
                      <td className="tc-table-cell">{user.email ?? "—"}</td>
                      <td className="tc-table-cell">{user.roles.join(", ")}</td>
                      <td className="tc-table-cell">{user.country ?? "—"}</td>
                      <td className="tc-table-cell">{user.preferredLang}</td>
                      <td className="tc-table-cell">{user.accountDisabled ? t("yes") : t("no")}</td>
                      <td className="tc-table-cell space-x-2">
                        <button
                          type="button"
                          className="text-brand-teal hover:underline"
                          onClick={() =>
                            setEditing(
                              editing?.id === user.id
                                ? null
                                : {
                                    id: user.id,
                                    roles: [...user.roles],
                                    accountDisabled: user.accountDisabled,
                                    founderProfile: user.founderProfile,
                                  }
                            )
                          }
                        >
                          {t("edit")}
                        </button>
                        <a
                          href={`/api/admin/users/${user.id}/export`}
                          className="text-brand-teal hover:underline"
                          download
                        >
                          {t("exportJson")}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} pageSize={pageSize} setPage={setPage} t={t} />
          {editing && (
            <UserEditPanel
              initial={editing}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                load();
              }}
              locale={locale}
            />
          )}
        </>
      )}
    </div>
  );
}

function UserEditPanel({
  initial,
  onClose,
  onSaved,
  locale,
}: {
  initial: { id: string; roles: string[]; accountDisabled: boolean; founderProfile: { verified: boolean } | null };
  onClose: () => void;
  onSaved: () => void;
  locale: string;
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const userId = initial.id;
  const [roles, setRoles] = useState<string[]>(initial.roles);
  const [disabled, setDisabled] = useState(initial.accountDisabled);
  const [reason, setReason] = useState("");
  const [founderV, setFounderV] = useState(initial.founderProfile?.verified ?? false);
  const hasFounder = Boolean(initial.founderProfile);
  const [investorV, setInvestorV] = useState(false);
  const [mentorV, setMentorV] = useState(false);
  const [hasInvestor, setHasInvestor] = useState(false);
  const [hasMentor, setHasMentor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        const u = d.user as {
          roles: string[];
          accountDisabled: boolean;
          founderProfile: { verified: boolean } | null;
          investorProfile: { verified: boolean } | null;
          mentorProfile: { verified: boolean } | null;
        };
        if (u) {
          setRoles([...u.roles]);
          setDisabled(u.accountDisabled);
          setFounderV(u.founderProfile?.verified ?? false);
          setHasInvestor(!!u.investorProfile);
          setHasMentor(!!u.mentorProfile);
          setInvestorV(u.investorProfile?.verified ?? false);
          setMentorV(u.mentorProfile?.verified ?? false);
        }
      });
  }, [userId]);

  async function save() {
    setSaving(true);
    const body: Record<string, unknown> = { roles, accountDisabled: disabled, reason: reason || undefined };
    if (hasFounder) body.founderVerified = founderV;
    if (hasInvestor) body.investorVerified = investorV;
    if (hasMentor) body.mentorVerified = mentorV;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else alert(t("saveFailed"));
  }

  async function removeUser() {
    const r = prompt(t("deleteConfirmPrompt"));
    if (!r) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: r }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    } else alert(t("deleteFailed"));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white p-6 shadow-tc-md sm:p-8">
        <h3 className="text-lg font-bold text-brand-green">{t("editUser")}</h3>
        <p className="text-xs leading-relaxed text-stone-500">{t("editUserHint")}</p>
        <div className="space-y-2">
          {USER_ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roles.includes(r)}
                onChange={() =>
                  setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
                }
              />
              {r}
            </label>
          ))}
        </div>
        {hasFounder && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={founderV} onChange={(e) => setFounderV(e.target.checked)} />
            {t("founderVerified")}
          </label>
        )}
        {hasInvestor && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={investorV} onChange={(e) => setInvestorV(e.target.checked)} />
            {t("investorVerified")}
          </label>
        )}
        {hasMentor && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mentorV} onChange={(e) => setMentorV(e.target.checked)} />
            {t("mentorVerified")}
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
          {t("accountDisabled")}
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reasonOptional")}
          className="tc-input"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={saving} className="tc-btn-primary disabled:opacity-50">
            {saving ? tCommon("loading") : tCommon("save")}
          </button>
          <button type="button" onClick={onClose} className="tc-btn-secondary">
            {t("cancel")}
          </button>
          <button type="button" onClick={removeUser} className="tc-btn-secondary ml-auto border-red-200 text-red-700 hover:bg-red-50">
            {t("deleteUser")}
          </button>
        </div>
        <Link href={`/${locale}/dashboard`} className="text-xs text-stone-500 block">
          {t("afterRoleChange")}
        </Link>
      </div>
    </div>
  );
}

function IdeasSection({
  t,
  tCommon,
  locale,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
  locale: string;
}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q, deleted: "false" });
    fetch(`/api/admin/ideas?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.ideas ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchIdea(id: string, body: Record<string, unknown>) {
    const reason = window.prompt(t("reasonOptional")) ?? "";
    const res = await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, reason: reason || undefined }),
    });
    if (res.ok) load();
    else alert(t("saveFailed"));
  }

  if (loading && rows.length === 0) return <p>{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchIdeas")} className="tc-input max-w-xs" />
        <button type="button" onClick={() => { setPage(1); load(); }} className="tc-btn-secondary">{t("search")}</button>
        <button
          type="button"
          onClick={() => {
            setQ("");
            const params = new URLSearchParams({ page: "1", deleted: "true" });
            fetch(`/api/admin/ideas?${params}`)
              .then((r) => r.json())
              .then((d) => {
                setRows(d.ideas ?? []);
                setTotal(d.total ?? 0);
              });
          }}
          className="tc-btn-secondary"
        >
          {t("showDeleted")}
        </button>
      </div>
      <div className="tc-table-shell overflow-x-auto">
        <table className="tc-table">
          <thead className="tc-table-head">
            <tr>
              <th className="tc-table-th">{t("title")}</th>
              <th className="tc-table-th">{t("founder")}</th>
              <th className="tc-table-th">{t("public")}</th>
              <th className="tc-table-th">{t("featured")}</th>
              <th className="tc-table-th">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const idea = row as {
                id: string;
                title: string;
                slug: string;
                isPublic: boolean;
                featured: boolean;
                deletedAt: string | null;
                founder: { user: { email: string | null } };
              };
              return (
                <tr key={idea.id}>
                  <td className="tc-table-cell">
                    <Link href={`/${locale}/cofounders/${idea.slug}`} className="text-brand-teal hover:underline">
                      {idea.title}
                    </Link>
                    {idea.deletedAt && <span className="ml-2 text-xs text-red-600">{t("deleted")}</span>}
                  </td>
                  <td className="tc-table-cell">{idea.founder.user.email ?? "—"}</td>
                  <td className="tc-table-cell">{idea.isPublic ? t("yes") : t("no")}</td>
                  <td className="tc-table-cell">{idea.featured ? t("yes") : t("no")}</td>
                  <td className="tc-table-cell flex flex-wrap gap-1">
                    <button type="button" className="text-xs text-brand-teal" onClick={() => patchIdea(idea.id, { isPublic: !idea.isPublic })}>
                      {idea.isPublic ? t("unlist") : t("list")}
                    </button>
                    <button type="button" className="text-xs text-brand-teal" onClick={() => patchIdea(idea.id, { featured: !idea.featured })}>
                      {idea.featured ? t("unfeature") : t("feature")}
                    </button>
                    {!idea.deletedAt ? (
                      <button type="button" className="text-xs text-red-600" onClick={() => patchIdea(idea.id, { softDelete: true })}>
                        {t("softDelete")}
                      </button>
                    ) : (
                      <button type="button" className="text-xs text-brand-teal" onClick={() => patchIdea(idea.id, { restore: true })}>
                        {t("restore")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={25} setPage={setPage} t={t} />
    </div>
  );
}

function ApplicationsSection({
  t,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    fetch(`/api/admin/applications?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.applications ?? []);
        setTotal(d.total ?? 0);
      });
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateApp(id: string, status: string) {
    const reason = window.prompt(t("reasonOptional")) ?? "";
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason: reason || undefined }),
    });
    if (res.ok) load();
    else alert(t("saveFailed"));
  }

  return (
    <div className="space-y-4">
      <div className="tc-table-shell overflow-x-auto">
        <table className="tc-table">
          <thead className="tc-table-head">
            <tr>
              <th className="tc-table-th">{t("idea")}</th>
              <th className="tc-table-th">{t("applicant")}</th>
              <th className="tc-table-th">{t("status")}</th>
              <th className="tc-table-th">{t("message")}</th>
              <th className="tc-table-th">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const app = row as {
                id: string;
                status: string;
                message: string | null;
                idea: { title: string };
                user: { email: string | null };
              };
              return (
                <tr key={app.id} className="align-top">
                  <td className="tc-table-cell">{app.idea.title}</td>
                  <td className="tc-table-cell">{app.user.email}</td>
                  <td className="tc-table-cell">{app.status}</td>
                  <td className="tc-table-cell max-w-xs whitespace-pre-wrap break-words text-xs">{app.message ?? "—"}</td>
                  <td className="tc-table-cell space-y-1">
                    {(["pending", "accepted", "rejected"] as const).map((s) => (
                      <button key={s} type="button" className="block text-xs text-brand-teal" onClick={() => updateApp(app.id, s)}>
                        → {s}
                      </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={30} setPage={setPage} t={t} />
    </div>
  );
}

function WaitlistSection({
  t,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/waitlist?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.entries ?? []);
        setTotal(d.total ?? 0);
      });
  }, [page]);

  return (
    <div className="space-y-4">
      <a href="/api/admin/waitlist/export" download className="tc-btn-primary inline-flex">
        {t("exportCsv")}
      </a>
      <div className="tc-table-shell overflow-x-auto">
        <table className="tc-table">
          <thead className="tc-table-head">
            <tr>
              <th className="tc-table-th">{t("email")}</th>
              <th className="tc-table-th">{t("role")}</th>
              <th className="tc-table-th">{t("country")}</th>
              <th className="tc-table-th">{t("lang")}</th>
              <th className="tc-table-th">{t("created")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const e = row as {
                id: string;
                email: string;
                role: string | null;
                country: string | null;
                language: string | null;
                createdAt: string;
              };
              return (
                <tr key={e.id}>
                  <td className="tc-table-cell">{e.email}</td>
                  <td className="tc-table-cell">{e.role ?? "—"}</td>
                  <td className="tc-table-cell">{e.country ?? "—"}</td>
                  <td className="tc-table-cell">{e.language ?? "—"}</td>
                  <td className="tc-table-cell">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={40} setPage={setPage} t={t} />
    </div>
  );
}

function CommunitySection({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-10">
      <AnnouncementsBlock t={t} />
      <div>
        <h3 className="font-medium mb-2">{t("events")}</h3>
        <AdminEvents />
      </div>
    </div>
  );
}

function AnnouncementsBlock({ t }: { t: (key: string) => string }) {
  const [list, setList] = useState<{ id: string; message: string; active: boolean }[]>([]);
  const [msg, setMsg] = useState("");

  function refresh() {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((d) => setList(d.announcements ?? []));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(active: boolean) {
    if (!msg.trim()) return;
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, active }),
    });
    setMsg("");
    refresh();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refresh();
  }

  return (
    <div className="tc-card space-y-4 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">{t("announcements")}</h3>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={t("announcementPlaceholder")}
        className="tc-textarea min-h-[88px]"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => create(false)} className="tc-btn-secondary">
          {t("saveDraft")}
        </button>
        <button type="button" onClick={() => create(true)} className="tc-btn-primary">
          {t("publishBanner")}
        </button>
      </div>
      <ul className="text-sm space-y-2">
        {list.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 border-t border-stone-100 pt-2">
            <span className={a.active ? "font-medium text-brand-green" : ""}>{a.message}</span>
            <button type="button" className="text-brand-teal text-xs" onClick={() => toggle(a.id, !a.active)}>
              {a.active ? t("deactivate") : t("activate")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuditSection({
  t,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/audit?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.logs ?? []);
        setTotal(d.total ?? 0);
      });
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="tc-table-shell overflow-x-auto">
        <table className="tc-table">
          <thead className="tc-table-head">
            <tr>
              <th className="tc-table-th">{t("when")}</th>
              <th className="tc-table-th">{t("actor")}</th>
              <th className="tc-table-th">{t("action")}</th>
              <th className="tc-table-th">{t("target")}</th>
              <th className="tc-table-th">{t("reason")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const log = row as {
                id: string;
                action: string;
                targetType: string;
                targetId: string | null;
                reason: string | null;
                createdAt: string;
                actor: { email: string | null };
              };
              return (
                <tr key={log.id} className="align-top">
                  <td className="tc-table-cell whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="tc-table-cell">{log.actor.email}</td>
                  <td className="tc-table-cell">{log.action}</td>
                  <td className="tc-table-cell">
                    {log.targetType} {log.targetId ? `· ${log.targetId.slice(0, 8)}…` : ""}
                  </td>
                  <td className="tc-table-cell max-w-[200px] break-words">{log.reason ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={50} setPage={setPage} t={t} />
    </div>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  setPage,
  t,
}: {
  page: number;
  total: number;
  pageSize: number;
  setPage: (n: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center gap-3 text-sm text-stone-600">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium shadow-sm transition hover:bg-stone-50 disabled:opacity-40"
      >
        {t("prev")}
      </button>
      <span className="tabular-nums font-medium text-stone-800">{t("pageOf", { page, pages })}</span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium shadow-sm transition hover:bg-stone-50 disabled:opacity-40"
      >
        {t("next")}
      </button>
    </div>
  );
}
