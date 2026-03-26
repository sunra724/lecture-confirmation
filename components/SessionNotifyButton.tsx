"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionNotifyButton({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleNotify() {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/notify`, {
        method: "POST"
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; link?: string; channel?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "링크 발송에 실패했습니다.");
      }

      window.alert(
        data?.link
          ? `메일과 문자/알림톡 발송이 완료되었습니다.\n${data.link}`
          : data?.message ?? "링크 발송이 완료되었습니다."
      );
      router.refresh();
    } catch (caughtError) {
      window.alert(caughtError instanceof Error ? caughtError.message : "링크 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="inline-flex items-center rounded-full border border-soilab-navy/15 px-3 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
      onClick={() => void handleNotify()}
      type="button"
    >
      {loading ? "메일+문자 발송 중..." : "메일+문자 발송"}
    </button>
  );
}
