"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionDeleteButton({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "이 강의 건을 삭제할까요?\n제출 정보와 첨부파일도 함께 삭제되며 복구할 수 없습니다."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "삭제 중 오류가 발생했습니다.");
      }

      router.refresh();
    } catch (caughtError) {
      window.alert(caughtError instanceof Error ? caughtError.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
      disabled={loading}
      onClick={handleDelete}
      type="button"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
