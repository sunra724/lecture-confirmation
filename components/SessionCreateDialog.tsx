"use client";

import { useState } from "react";
import type { SessionInput, SessionRecord } from "@/lib/types";
import { formatFeeInput, getQuarterHourOptions, parseFeeInput } from "@/lib/utils";

const INITIAL_FORM: SessionInput = {
  business_name: "",
  lecture_title: "",
  lecture_date: "",
  lecture_place: "",
  time_start: "",
  time_end: "",
  fee: 0,
  lecturer_name: "",
  lecturer_phone: "",
  lecturer_email: ""
};

export function SessionCreateDialog({
  onCreated
}: {
  onCreated: (session: SessionRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [form, setForm] = useState<SessionInput>(INITIAL_FORM);
  const [feeInput, setFeeInput] = useState("");
  const timeOptions = getQuarterHourOptions();

  function updateField<Key extends keyof SessionInput>(key: Key, value: SessionInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "강의 건 생성에 실패했습니다.");
      }

      const created = (await response.json()) as SessionRecord;
      onCreated(created);
      setCreatedLink(`${window.location.origin}/form/${created.token}`);
      setForm(INITIAL_FORM);
      setFeeInput("");
    } catch (caughtError) {
      window.alert(caughtError instanceof Error ? caughtError.message : "강의 건 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCreatedLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    window.alert("링크를 복사했습니다.");
  }

  return (
    <>
      <button
        className="rounded-full bg-soilab-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        onClick={() => setOpen(true)}
        type="button"
      >
        새 강의세션 만들기
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-10">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">새 강의세션 만들기</h2>
                <p className="mt-2 text-sm text-slate-500">생성 후 공개 제출 링크를 바로 복사할 수 있습니다.</p>
              </div>
              <button
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  setOpen(false);
                  setCreatedLink("");
                }}
                type="button"
              >
                닫기
              </button>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">사업명</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("business_name", event.target.value)}
                  value={form.business_name}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강의명 *</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecture_title", event.target.value)}
                  required
                  value={form.lecture_title}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강의일 *</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecture_date", event.target.value)}
                  required
                  type="date"
                  value={form.lecture_date}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강의 장소 *</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecture_place", event.target.value)}
                  required
                  value={form.lecture_place}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">시작 시간 *</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("time_start", event.target.value)}
                  required
                  value={form.time_start}
                >
                  <option value="">시작 시간 선택</option>
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">종료 시간 *</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("time_end", event.target.value)}
                  required
                  value={form.time_end}
                >
                  <option value="">종료 시간 선택</option>
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강사비 *</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  inputMode="numeric"
                  onChange={(event) => {
                    const nextValue = formatFeeInput(event.target.value);
                    setFeeInput(nextValue);
                    updateField("fee", parseFeeInput(nextValue));
                  }}
                  placeholder="예: 150,000"
                  required
                  value={feeInput}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강사명</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecturer_name", event.target.value)}
                  value={form.lecturer_name}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">연락처</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecturer_phone", event.target.value)}
                  value={form.lecturer_phone}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">강사 이메일</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  onChange={(event) => updateField("lecturer_email", event.target.value)}
                  placeholder="example@email.com"
                  type="email"
                  value={form.lecturer_email}
                />
              </label>

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  className="rounded-full bg-soilab-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "생성 중..." : "강의세션 생성"}
                </button>
                {createdLink ? (
                  <button
                    className="rounded-full border border-soilab-navy/20 px-5 py-3 text-sm font-semibold text-soilab-navy transition hover:bg-soilab-paper"
                    onClick={copyCreatedLink}
                    type="button"
                  >
                    링크 복사
                  </button>
                ) : null}
              </div>

              {createdLink ? (
                <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">생성된 링크</div>
                  <div className="mt-2 break-all">{createdLink}</div>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
