"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploadZone } from "@/components/FileUploadZone";
import { MultiFileUploadZone } from "@/components/MultiFileUploadZone";
import { SignaturePad } from "@/components/SignaturePad";
import type { SessionRecord } from "@/lib/types";
import { calcLectureHours, formatDate, formatFee, normalizePhone } from "@/lib/utils";

const BANK_OPTIONS = ["국민", "신한", "우리", "하나", "농협", "카카오뱅크", "토스뱅크", "기업", "SC", "부산", "대구", "기타"];

export function LectureForm({ session }: { session: SessionRecord }) {
  const router = useRouter();
  const [lecturerName, setLecturerName] = useState(session.lecturer_name);
  const [lecturerPhone, setLecturerPhone] = useState(session.lecturer_phone);
  const [affiliationTitle, setAffiliationTitle] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankbook, setBankbook] = useState<File | null>(null);
  const [idCard, setIdCard] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [lecturePlanFile, setLecturePlanFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !lecturerName.trim() ||
      !lecturerPhone.trim() ||
      !affiliationTitle.trim() ||
      !address.trim() ||
      !bankName ||
      !accountNumber.trim() ||
      !accountHolder.trim()
    ) {
      window.alert("필수 입력 항목을 모두 입력해주세요.");
      return;
    }

    if (!bankbook || !idCard || !resumeFile || !lecturePlanFile) {
      window.alert("신분증사본, 통장사본, 이력서, 강의계획서를 모두 첨부해주세요.");
      return;
    }

    if (!signatureData) {
      window.alert("서명을 완료해주세요.");
      return;
    }

    if (!privacyConsent) {
      window.alert("개인정보 제공 동의에 체크해주세요.");
      return;
    }

    const formData = new FormData();
    formData.set("token", session.token);
    formData.set("lecturer_name", lecturerName.trim());
    formData.set("lecturer_phone", lecturerPhone.trim());
    formData.set("affiliation_title", affiliationTitle.trim());
    formData.set("address", address.trim());
    formData.set("bank_name", bankName);
    formData.set("account_number", accountNumber.trim());
    formData.set("account_holder", accountHolder.trim());
    formData.set("privacy_consent", privacyConsent ? "yes" : "no");
    formData.set("signature_data", signatureData);
    formData.set("bankbook", bankbook);
    formData.set("id_card", idCard);
    formData.set("resume", resumeFile);
    formData.set("lecture_plan", lecturePlanFile);
    supportingFiles.forEach((file) => formData.append("supporting_documents", file));

    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "제출 중 오류가 발생했습니다.");
      }

      router.push("/submit-complete");
      router.refresh();
    } catch (caughtError) {
      window.alert(caughtError instanceof Error ? caughtError.message : "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
        <h2 className="text-lg font-bold text-slate-900">강의 정보 확인</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">사업명</dt>
            <dd className="mt-1 text-sm text-slate-700">{session.business_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강의명</dt>
            <dd className="mt-1 text-sm text-slate-700">{session.lecture_title}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강사비</dt>
            <dd className="mt-1 text-sm text-slate-700">{formatFee(session.fee)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강의일시</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {formatDate(session.lecture_date)} / {session.time_start} - {session.time_end} /{" "}
              {calcLectureHours(session.time_start, session.time_end)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강의장소</dt>
            <dd className="mt-1 text-sm text-slate-700">{session.lecture_place}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">강사 정보 입력</h2>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">성명 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setLecturerName(event.target.value)}
            value={lecturerName}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">연락처 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setLecturerPhone(normalizePhone(event.target.value))}
            value={lecturerPhone}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">소속 및 직위 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setAffiliationTitle(event.target.value)}
            value={affiliationTitle}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">주소 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setAddress(event.target.value)}
            value={address}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">계좌 정보 입력</h2>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">은행명 *</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setBankName(event.target.value)}
            value={bankName}
          >
            {BANK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">계좌번호 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
            value={accountNumber}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">예금주 *</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            onChange={(event) => setAccountHolder(event.target.value)}
            value={accountHolder}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">파일 첨부</h2>
        <FileUploadZone accept="image/*,.pdf" file={idCard} label="신분증사본" onFileSelect={setIdCard} required />
        <p className="text-xs text-slate-500">(주민등록증, 운전면허증, 여권 중 하나)</p>
        <FileUploadZone
          accept="image/*,.pdf"
          file={bankbook}
          label="통장사본 또는 계좌개설확인서"
          onFileSelect={setBankbook}
          required
        />
        <FileUploadZone accept="image/*,.pdf" file={resumeFile} label="이력서" onFileSelect={setResumeFile} required />
        <FileUploadZone
          accept="image/*,.pdf"
          file={lecturePlanFile}
          label="강의계획서"
          onFileSelect={setLecturePlanFile}
          required
        />
        <MultiFileUploadZone
          accept="image/*,.pdf"
          files={supportingFiles}
          label="기타 증빙서류"
          onFilesChange={setSupportingFiles}
        />
        <p className="text-xs text-slate-500">
          (학위증명서, 경력증명서, 자격증 등 필요한 파일을 여러 개 첨부할 수 있습니다.)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">서명</h2>
        <SignaturePad onSave={setSignatureData} />
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <input
            checked={privacyConsent}
            className="mt-1 h-4 w-4 rounded border-slate-300"
            onChange={(event) => setPrivacyConsent(event.target.checked)}
            type="checkbox"
          />
          <span>
            위 개인정보 및 고유식별정보는 원천징수 및 소득 지급 목적으로만 사용됨에 동의합니다.
          </span>
        </label>
      </section>

      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-soilab-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "제출 중..." : "강의확인서 제출"}
      </button>
    </form>
  );
}
