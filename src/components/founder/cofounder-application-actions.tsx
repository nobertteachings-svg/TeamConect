"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CoFounderApplicationActions({
  appId,
  status,
  acceptBlocked,
}: {
  appId: string;
  status: string;
  /** True when there is no free co-founder slot (cannot move to accepted unless already accepted). */
  acceptBlocked: boolean;
}) {
  const t = useTranslations("applicationActions");
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setValue(status);
  }, [status]);

  async function updateStatus(newStatus: string) {
    if (newStatus === "accepted" && status !== "accepted" && acceptBlocked) {
      setErr(t("teamFull"));
      return;
    }
    setLoading(true);
    setErr(null);
    setValue(newStatus);
    try {
      const res = await fetch(`/api/cofounder-applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setValue(status);
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(typeof d.error === "string" ? d.error : t("updateFailed"));
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      {err && <p className="mb-1 max-w-[14rem] text-xs text-red-600">{err}</p>}
      <select
        value={value}
        onChange={(e) => void updateStatus(e.target.value)}
        disabled={loading}
        className="rounded border border-stone-300 px-2 py-1 text-sm"
      >
        <option value="pending">{t("pending")}</option>
        <option value="accepted">{t("accepted")}</option>
        <option value="rejected">{t("rejected")}</option>
      </select>
    </div>
  );
}
