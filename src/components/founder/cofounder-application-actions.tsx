"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CoFounderApplicationActions({ appId, status }: { appId: string; status: string }) {
  const t = useTranslations("applicationActions");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/cofounder-applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => updateStatus(e.target.value)}
      disabled={loading}
      className="text-sm border border-stone-300 rounded px-2 py-1"
    >
      <option value="pending">{t("pending")}</option>
      <option value="accepted">{t("accepted")}</option>
      <option value="rejected">{t("rejected")}</option>
    </select>
  );
}
