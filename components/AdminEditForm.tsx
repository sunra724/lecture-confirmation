"use client";

import { useState } from "react";
import type { SessionRecord, SubmissionRecord } from "@/lib/types";
import { formatFeeInput, getQuarterHourOptions, normalizePhone, parseFeeInput } from "@/lib/utils";

export function AdminEditForm({
  session,
  submission
}: {
  session: SessionRecord;
  submission: SubmissionRecord | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    business_name: session.business_name,
    lecture_title: session.lecture_title,
    lecture_date: session.lecture_date,
    lecture_place: session.lecture_place,
    time_start: session.time_start,
    time_end: session.time_end,
    fee: session.fee,
    fee_input: session.fee ? formatFeeInput(String(session.fee)) : "",
    lecturer_name: submission?.lecturer_name ?? session.lecturer_name,
    lecturer_phone: submission?.lecturer_phone ?? session.lecturer_phone,
    lecturer_email: session.lecturer_email ?? "",
    resident_id: submission?.resident_id ?? "",
    affiliation_title: submission?.affiliation_title ?? "",
    address: submission?.address ?? "",
    bank_name: submission?.bank_name ?? "",
    account_number: submission?.account_number ?? "",
    account_holder: submission?.account_holder ?? ""
  });

  const timeOptions = getQuarterHourOptions();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          business_name: form.business_name,
          lecture_title: form.lecture_title,
          lecture_date: form.lecture_date,
          lecture_place: form.lecture_place,
          time_start: form.time_start,
          time_end: form.time_end,
          fee: form.fee,
          lecturer_name: form.lecturer_name,
          lecturer_phone: form.lecturer_phone,
          lecturer_email: form.lecturer_email,
          resident_id: form.resident_id,
          affiliation_title: form.affiliation_title,
          address: form.address,
          bank_name: form.bank_name,
          account_number: form.account_number,
          account_holder: form.account_holder
        })
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message ?? "수정 저장에 실패했습니다.");
      }

      setMessage("수정사항을 저장했습니다. 화면을 새로고침합니다.");
      window.location.reload();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "수정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-800">사업명</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))} value={form.business_name} />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-800">강의명 *</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, lecture_title: event.target.value }))} value={form.lecture_title} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">강의일 *</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, lecture_date: event.target.value }))} type="date" value={form.lecture_date} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">강의 장소 *</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, lecture_place: event.target.value }))} value={form.lecture_place} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">시작 시간 *</span>
        <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, time_start: event.target.value }))} value={form.time_start}>
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">종료 시간 *</span>
        <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, time_end: event.target.value }))} value={form.time_end}>
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
            const feeInput = formatFeeInput(event.target.value);
            setForm((current) => ({ ...current, fee_input: feeInput, fee: parseFeeInput(feeInput) }));
          }}
          value={form.fee_input}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">강사명 *</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, lecturer_name: event.target.value }))} value={form.lecturer_name} />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-800">연락처 *</span>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, lecturer_phone: normalizePhone(event.target.value) }))} value={form.lecturer_phone} />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-800">강사 이메일</span>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          onChange={(event) => setForm((current) => ({ ...current, lecturer_email: event.target.value }))}
          placeholder="example@email.com"
          type="email"
          value={form.lecturer_email}
        />
      </label>
      {submission ? (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">주민번호</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              onChange={(event) => setForm((current) => ({ ...current, resident_id: event.target.value }))}
              placeholder="000000-0000000"
              value={form.resident_id}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">소속 및 직위</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, affiliation_title: event.target.value }))} value={form.affiliation_title} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">주소</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} value={form.address} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">은행명</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))} value={form.bank_name} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">계좌번호</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))} value={form.account_number} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-800">예금주</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" onChange={(event) => setForm((current) => ({ ...current, account_holder: event.target.value }))} value={form.account_holder} />
          </label>
        </>
      ) : null}
      <div className="md:col-span-2 flex items-center gap-3">
        <button className="rounded-full bg-soilab-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={loading} type="submit">
          {loading ? "저장 중..." : "수정 저장"}
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
