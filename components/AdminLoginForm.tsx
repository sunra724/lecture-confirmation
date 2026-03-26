"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "관리자 로그인에 실패했습니다.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">관리자 비밀번호</span>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호 입력"
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-soilab-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={loading || !password.trim()}
        type="submit"
      >
        {loading ? "로그인 중..." : "관리자 로그인"}
      </button>
    </form>
  );
}
