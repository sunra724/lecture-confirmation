"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: SessionStatus; label: string }> = [
  { value: "pending", label: "제출 요청" },
  { value: "submitted", label: "서류 제출" },
  { value: "reviewed", label: "검토 완료" },
  { value: "paid", label: "지급 완료" }
];

export function SessionStatusActions({ sessionId, currentStatus }: { sessionId: number; currentStatus: SessionStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<SessionStatus | null>(null);

  async function handleStatusChange(status: SessionStatus) {
    setLoading(status);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "상태 변경 중 오류가 발생했습니다.");
      }

      router.refresh();
    } catch (caughtError) {
      window.alert(caughtError instanceof Error ? caughtError.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((option) => (
        <button
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            currentStatus === option.value
              ? "bg-soilab-navy text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          disabled={loading !== null}
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          type="button"
        >
          {loading === option.value ? "변경 중..." : option.label}
        </button>
      ))}
    </div>
  );
}
