import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminAttachmentManager } from "@/components/AdminAttachmentManager";
import { AdminEditForm } from "@/components/AdminEditForm";
import { CopyButton } from "@/components/CopyButton";
import { SessionDeleteButton } from "@/components/SessionDeleteButton";
import { SessionStatusActions } from "@/components/SessionStatusActions";
import { requireAdminSession } from "@/lib/auth";
import { getSessionDetail } from "@/lib/db";
import {
  calcLectureHours,
  formatDate,
  formatDateTime,
  formatFee,
  getStatusBadgeClass,
  getStatusLabel,
  normalizePhone
} from "@/lib/utils";

export default async function AdminDetailPage({ params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    redirect("/admin/login");
  }

  const detail = await getSessionDetail(Number(params.id));
  if (!detail) notFound();

  const { session, submission, attachments } = detail;
  const attachmentMap = Object.fromEntries(
    attachments
      .filter((attachment) => attachment.file_type !== "supporting_document")
      .map((attachment) => [attachment.file_type, attachment])
  );
  const supportingDocuments = attachments.filter((attachment) => attachment.file_type === "supporting_document");

  const attachmentLabels: Array<{ key: string; label: string }> = [
    { key: "bankbook", label: "통장사본" },
    { key: "id_card", label: "신분증사본" },
    { key: "resume", label: "이력서" },
    { key: "lecture_plan", label: "강의계획서" }
  ];

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link className="inline-flex text-sm font-semibold text-soilab-navy" href="/admin">
          ← 목록으로
        </Link>

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">관리자 수정</h2>
          <p className="mt-2 text-sm text-slate-500">강사 입력값이 부정확한 경우 여기서 직접 수정할 수 있습니다.</p>
          <AdminEditForm session={session} submission={submission} />
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{session.lecture_title}</h1>
              <p className="mt-2 text-sm text-slate-500">제출 내역, 첨부파일, 상태 변경을 여기서 관리할 수 있습니다.</p>
            </div>
            <SessionDeleteButton sessionId={session.id} />
          </div>

          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">사업명</dt>
              <dd className="mt-1 text-sm text-slate-700">{session.business_name || "-"}</dd>
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
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강사비</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatFee(session.fee)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">상태</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(session.status)}`}
                >
                  {getStatusLabel(session.status)}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">상태 변경</h2>
          <p className="mt-2 text-sm text-slate-500">제출 검토 후 검토 완료, 지급 완료 상태로 갱신할 수 있습니다.</p>
          <div className="mt-4">
            <SessionStatusActions currentStatus={session.status} sessionId={session.id} />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">강사 제출 정보</h2>
          {submission ? (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">OCR 추출 정보 (수정 가능)</h3>
                <p className="mt-1 text-xs text-slate-500">OCR 원문도 함께 저장되어 있어, 주민번호 인식이 애매할 때 바로 확인하고 보정할 수 있습니다.</p>
                <dl className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">이름</dt>
                    <dd className="mt-1 text-sm text-slate-700">{submission.ocr_name || submission.lecturer_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">주민번호</dt>
                    <dd className="mt-1 text-sm text-slate-700">{submission.resident_id || "-"}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">주소</dt>
                    <dd className="mt-1 text-sm text-slate-700">{submission.ocr_address || submission.address || "-"}</dd>
                  </div>
                </dl>
                <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">OCR 원문 보기</summary>
                  <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-600">{submission.ocr_raw || "저장된 OCR 원문이 없습니다."}</pre>
                </details>
              </div>

              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">강사명</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.lecturer_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">연락처</dt>
                  <dd className="mt-1 text-sm text-slate-700">{normalizePhone(submission.lecturer_phone)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">이메일</dt>
                  <dd className="mt-1 text-sm text-slate-700">{session.lecturer_email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">주민번호</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.resident_id || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">소속 및 직위</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.affiliation_title || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">주소</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.address || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">은행명</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.bank_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">계좌번호</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.account_number}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">예금주</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.account_holder}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">제출일시</dt>
                  <dd className="mt-1 text-sm text-slate-700">{formatDateTime(submission.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">개인정보 동의</dt>
                  <dd className="mt-1 text-sm text-slate-700">{submission.privacy_consent ? "동의함" : "미동의"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">아직 제출되지 않았습니다.</p>
          )}
        </section>

        {submission ? (
          <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">서명 이미지</h2>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="강사 서명" className="max-h-48 w-full object-contain" src={submission.signature_data} />
            </div>
          </section>
        ) : null}

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">첨부파일 다운로드</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {attachmentLabels.map((item) =>
              attachmentMap[item.key] ? (
                <a
                  className="inline-flex items-center rounded-full border border-soilab-navy/15 px-4 py-2 text-sm font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                  href={`/api/files/${attachmentMap[item.key].id}`}
                  key={item.key}
                >
                  {item.label} 다운로드
                </a>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-400" key={item.key}>
                  {item.label} 없음
                </span>
              )
            )}
            {supportingDocuments.length ? (
              supportingDocuments.map((attachment, index) => (
                <a
                  className="inline-flex items-center rounded-full border border-soilab-navy/15 px-4 py-2 text-sm font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                  href={`/api/files/${attachment.id}`}
                  key={attachment.id}
                >
                  기타 증빙서류 {index + 1} 다운로드
                </a>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-400">
                기타 증빙서류 없음
              </span>
            )}
          </div>
        </section>

        {submission ? <AdminAttachmentManager attachments={attachments} sessionId={session.id} /> : null}

        <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">강사 링크</h2>
          <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="break-all">{`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/form/${session.token}`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton
                label="링크 복사"
                text={`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/form/${session.token}`}
              />
              <Link
                className="inline-flex items-center rounded-full border border-soilab-navy/15 px-3 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                href={`/admin/${session.id}/print`}
                target="_blank"
              >
                PDF 출력
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
