"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsBell() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationRow[]; unreadCount: number };
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 120_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ readIds: ids }),
    });
    void load();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAll: true }),
    });
    void load();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          if (!open) void load();
        }}
        className="relative rounded-xl p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
        aria-expanded={open}
        aria-label={t("ariaLabel")}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-stone-200/90 bg-white py-2 shadow-tc-md">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t("title")}</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-brand-teal hover:text-brand-green"
              >
                {t("markAllRead")}
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(70vh,320px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">{t("empty")}</p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div
                    className={`px-4 py-3 text-left transition hover:bg-stone-50 ${
                      !n.readAt ? "bg-brand-green/[0.04]" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-stone-900">{n.title}</p>
                    {n.body ? <p className="mt-1 text-xs leading-relaxed text-stone-600">{n.body}</p> : null}
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link.startsWith("/") ? n.link : `/${locale}${n.link}`}
                    onClick={() => {
                      if (!n.readAt) void markRead([n.id]);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    className="block w-full"
                    onClick={() => {
                      if (!n.readAt) void markRead([n.id]);
                    }}
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
