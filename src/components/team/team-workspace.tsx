"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatStoredCountry } from "@/lib/countries-full";

type Member = {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    country: string | null;
  };
};

type Post = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null; email: string | null; image: string | null };
};

const MAX_THREAD_DEPTH_UI = 8;

function buildChildrenMap(posts: Post[]): Map<string | null, Post[]> {
  const ids = new Set(posts.map((p) => p.id));
  const effectiveParentId = (p: Post): string | null => {
    if (!p.parentId) return null;
    return ids.has(p.parentId) ? p.parentId : null;
  };
  const map = new Map<string | null, Post[]>();
  for (const p of posts) {
    const k = effectiveParentId(p);
    const arr = map.get(k);
    if (arr) arr.push(p);
    else map.set(k, [p]);
  }
  for (const arr of Array.from(map.values())) {
    arr.sort(
      (a: Post, b: Post) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return map;
}

function postWasEdited(p: Post): boolean {
  return new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() > 500;
}

type PostBlockCtx = {
  teamId: string;
  currentUserId: string;
  currentUserRole: string;
  busy: boolean;
  replyingToId: string | null;
  setReplyingToId: (v: string | null) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  editBody: string;
  setEditBody: (v: string) => void;
  submitReply: (parentId: string) => Promise<void>;
  saveEdit: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  t: (key: string) => string;
};

function PostBlock({
  post,
  childrenByParent,
  depth,
  ctx,
}: {
  post: Post;
  childrenByParent: Map<string | null, Post[]>;
  depth: number;
  ctx: PostBlockCtx;
}) {
  const replies = childrenByParent.get(post.id) ?? [];
  const isAuthor = post.author.id === ctx.currentUserId;
  const canDelete = isAuthor || ctx.currentUserRole === "FOUNDER";
  const canReplyHere = depth < MAX_THREAD_DEPTH_UI;
  const authorLabel = isAuthor ? ctx.t("you") : post.author.name ?? post.author.email ?? "—";

  return (
    <div>
      <article className="tc-card border-l-4 border-l-brand-teal/40 p-4 sm:p-5">
        <header className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold text-stone-900">{authorLabel}</span>
          <time className="text-xs text-stone-500" dateTime={post.createdAt}>
            {new Date(post.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          {postWasEdited(post) && <span className="text-xs text-stone-400">{ctx.t("edited")}</span>}
        </header>
        {ctx.editingId === post.id ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ctx.saveEdit(post.id);
            }}
          >
            <textarea
              value={ctx.editBody}
              onChange={(e) => ctx.setEditBody(e.target.value)}
              rows={4}
              className="tc-input w-full resize-y"
              disabled={ctx.busy}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={ctx.busy || !ctx.editBody.trim()}
                className="tc-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {ctx.t("saveEdit")}
              </button>
              <button
                type="button"
                disabled={ctx.busy}
                onClick={() => {
                  ctx.setEditingId(null);
                  ctx.setEditBody("");
                }}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {ctx.t("cancelEdit")}
              </button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{post.body}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {canReplyHere && (
            <button
              type="button"
              disabled={ctx.busy}
              onClick={() => {
                ctx.setEditingId(null);
                ctx.setReplyingToId(post.id);
                ctx.setReplyBody("");
              }}
              className="text-xs font-semibold text-brand-teal hover:underline disabled:opacity-50"
            >
              {ctx.t("reply")}
            </button>
          )}
          {isAuthor && ctx.editingId !== post.id && (
            <button
              type="button"
              disabled={ctx.busy}
              onClick={() => {
                ctx.setReplyingToId(null);
                ctx.setEditingId(post.id);
                ctx.setEditBody(post.body);
              }}
              className="text-xs font-semibold text-stone-600 hover:underline disabled:opacity-50"
            >
              {ctx.t("editPost")}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              disabled={ctx.busy}
              onClick={() => void ctx.deletePost(post.id)}
              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
            >
              {ctx.t("deletePost")}
            </button>
          )}
        </div>
        {ctx.replyingToId === post.id && (
          <form
            className="mt-3 space-y-2 rounded-lg border border-stone-200 bg-stone-50/80 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ctx.submitReply(post.id);
            }}
          >
            <label className="tc-label text-xs">{ctx.t("reply")}</label>
            <textarea
              value={ctx.replyBody}
              onChange={(e) => ctx.setReplyBody(e.target.value)}
              rows={3}
              className="tc-input w-full resize-y"
              placeholder={ctx.t("replyPlaceholder")}
              disabled={ctx.busy}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={ctx.busy || !ctx.replyBody.trim()}
                className="tc-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {ctx.t("replySubmit")}
              </button>
              <button
                type="button"
                disabled={ctx.busy}
                onClick={() => {
                  ctx.setReplyingToId(null);
                  ctx.setReplyBody("");
                }}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {ctx.t("replyCancel")}
              </button>
            </div>
          </form>
        )}
      </article>
      {replies.length > 0 && (
        <div className="mt-3 ml-1 space-y-3 border-l-2 border-stone-200 pl-3">
          {replies.map((r) => (
            <PostBlock key={r.id} post={r} childrenByParent={childrenByParent} depth={depth + 1} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}

type Resource = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
};

type Meeting = {
  id: string;
  title: string;
  startsAt: string | null;
  meetingUrl: string | null;
  notes: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
};

export function TeamWorkspace({
  teamId,
  idea,
  members,
  initialPosts,
  initialResources,
  initialMeetings,
  currentUserId,
  currentUserRole,
}: {
  teamId: string;
  idea: { title: string; slug: string };
  members: Member[];
  initialPosts: Post[];
  initialResources: Resource[];
  initialMeetings: Meeting[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const locale = useLocale();
  const t = useTranslations("teamWorkspace");
  const router = useRouter();
  const [tab, setTab] = useState<"discussion" | "resources" | "meetings">("discussion");
  const [busy, setBusy] = useState(false);
  const [postBody, setPostBody] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [mtTitle, setMtTitle] = useState("");
  const [mtWhen, setMtWhen] = useState("");
  const [mtUrl, setMtUrl] = useState("");
  const [mtNotes, setMtNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  async function refresh() {
    router.refresh();
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const body = postBody.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setPostBody("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(parentId: string) {
    setErr(null);
    const body = replyBody.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        const raw = d.error ?? t("errorGeneric");
        setErr(raw === "Thread too deep" ? t("threadTooDeep") : raw);
        return;
      }
      setReplyBody("");
      setReplyingToId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(postId: string) {
    setErr(null);
    const body = editBody.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setEditingId(null);
      setEditBody("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm(t("deletePostConfirm"))) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      if (replyingToId === postId) {
        setReplyingToId(null);
        setReplyBody("");
      }
      if (editingId === postId) {
        setEditingId(null);
        setEditBody("");
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitResource(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!resTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resTitle.trim(),
          url: resUrl.trim() || undefined,
          description: resDesc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setResTitle("");
      setResUrl("");
      setResDesc("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitMeeting(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!mtTitle.trim()) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: mtTitle.trim(),
        meetingUrl: mtUrl.trim() || undefined,
        notes: mtNotes.trim() || undefined,
      };
      if (mtWhen.trim()) {
        const d = new Date(mtWhen);
        if (!Number.isNaN(d.getTime())) payload.startsAt = d.toISOString();
      }
      const res = await fetch(`/api/teams/${teamId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setMtTitle("");
      setMtWhen("");
      setMtUrl("");
      setMtNotes("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const childrenByParent = useMemo(() => buildChildrenMap(initialPosts), [initialPosts]);
  const rootPosts = childrenByParent.get(null) ?? [];

  const postCtx: PostBlockCtx = {
    teamId,
    currentUserId,
    currentUserRole,
    busy,
    replyingToId,
    setReplyingToId,
    replyBody,
    setReplyBody,
    editingId,
    setEditingId,
    editBody,
    setEditBody,
    submitReply,
    saveEdit,
    deletePost,
    t: t as (key: string) => string,
  };

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setErr(null);
      }}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        tab === id
          ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/${locale}/dashboard/teams`}
          className="text-sm font-semibold text-brand-teal hover:text-brand-green"
        >
          {t("backTeams")}
        </Link>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-green">{idea.title}</h2>
        <p className="mt-1 text-sm text-stone-600">
          <Link href={`/${locale}/cofounders/${idea.slug}`} className="text-brand-teal hover:underline">
            {t("viewPublicListing")}
          </Link>
        </p>
      </div>

      <div className="tc-card p-5 sm:p-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">{t("membersHeading")}</h3>
        <ul className="flex flex-wrap gap-3">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm"
            >
              {m.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">
                  {(m.user.name ?? m.user.email ?? "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <span className="font-medium text-stone-900">{m.user.name ?? m.user.email ?? "—"}</span>
                <span className="ml-2 text-xs text-stone-500">
                  {m.role === "FOUNDER" ? t("roleFounder") : t("roleMember")}
                  {m.user.country ? ` · ${formatStoredCountry(m.user.country) ?? m.user.country}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {tabBtn("discussion", t("tabDiscussion"))}
        {tabBtn("resources", t("tabResources"))}
        {tabBtn("meetings", t("tabMeetings"))}
      </div>

      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
      )}

      {tab === "discussion" && (
        <div className="space-y-6">
          <form onSubmit={submitPost} className="tc-card space-y-3 p-5">
            <label className="tc-label">{t("postLabel")}</label>
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              rows={4}
              className="tc-input w-full resize-y"
              placeholder={t("postPlaceholder")}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !postBody.trim()} className="tc-btn-primary px-6 py-2.5 disabled:opacity-50">
              {busy ? t("postSending") : t("postSubmit")}
            </button>
          </form>
          <div className="space-y-4">
            {rootPosts.length === 0 && <p className="text-sm text-stone-500">{t("discussionEmpty")}</p>}
            {rootPosts.map((p) => (
              <PostBlock key={p.id} post={p} childrenByParent={childrenByParent} depth={1} ctx={postCtx} />
            ))}
          </div>
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-6">
          <form onSubmit={submitResource} className="tc-card grid gap-3 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="tc-label">{t("resourceTitle")}</label>
              <input
                className="tc-input mt-1 w-full"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="tc-label">{t("resourceUrl")}</label>
              <input
                className="tc-input mt-1 w-full"
                type="url"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                placeholder="https://"
                disabled={busy}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="tc-label">{t("resourceDesc")}</label>
              <textarea
                className="tc-input mt-1 w-full resize-y"
                rows={2}
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy || !resTitle.trim()} className="tc-btn-primary px-6 py-2.5 disabled:opacity-50">
                {t("addResource")}
              </button>
            </div>
          </form>
          <ul className="space-y-3">
            {initialResources.map((r) => (
              <li key={r.id} className="tc-card p-4">
                <p className="font-semibold text-brand-green">{r.title}</p>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-brand-teal hover:underline">
                    {r.url}
                  </a>
                )}
                {r.description && <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">{r.description}</p>}
                <p className="mt-2 text-xs text-stone-400">
                  {r.author.name ?? "—"} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "meetings" && (
        <div className="space-y-6">
          <form onSubmit={submitMeeting} className="tc-card grid gap-3 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="tc-label">{t("meetingTitle")}</label>
              <input
                className="tc-input mt-1 w-full"
                value={mtTitle}
                onChange={(e) => setMtTitle(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="tc-label">{t("meetingWhen")}</label>
              <input
                type="datetime-local"
                className="tc-input mt-1 w-full"
                value={mtWhen}
                onChange={(e) => setMtWhen(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="tc-label">{t("meetingUrl")}</label>
              <input
                className="tc-input mt-1 w-full"
                type="url"
                value={mtUrl}
                onChange={(e) => setMtUrl(e.target.value)}
                placeholder="https://zoom.us/..."
                disabled={busy}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="tc-label">{t("meetingNotes")}</label>
              <textarea
                className="tc-input mt-1 w-full resize-y"
                rows={3}
                value={mtNotes}
                onChange={(e) => setMtNotes(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy || !mtTitle.trim()} className="tc-btn-primary px-6 py-2.5 disabled:opacity-50">
                {t("addMeeting")}
              </button>
            </div>
          </form>
          <ul className="space-y-3">
            {initialMeetings.map((m) => (
              <li key={m.id} className="tc-card p-4">
                <p className="font-semibold text-brand-green">{m.title}</p>
                {m.startsAt && (
                  <p className="mt-1 text-sm text-stone-700">
                    {new Date(m.startsAt).toLocaleString(undefined, {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                )}
                {m.meetingUrl && (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-brand-teal hover:underline"
                  >
                    {t("joinMeeting")}
                  </a>
                )}
                {m.notes && <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">{m.notes}</p>}
                <p className="mt-2 text-xs text-stone-400">
                  {m.author.name ?? "—"} · {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
