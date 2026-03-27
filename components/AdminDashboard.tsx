"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SessionRecord, SessionStatus } from "@/lib/types";
import { SessionCreateDialog } from "@/components/SessionCreateDialog";
import { SessionDeleteButton } from "@/components/SessionDeleteButton";
import { SessionNotifyButton } from "@/components/SessionNotifyButton";
import {
  formatDate,
  formatDateTime,
  formatFee,
  getNotificationChannelLabel,
  getStatusBadgeClass,
  getStatusLabel,
  normalizePhone
} from "@/lib/utils";

const FILTERS: Array<{ key: "all" | SessionStatus; label: string }> = [
  { key: "all", label: "전체" },
  { key: "pending", label: "제출 요청" },
  { key: "submitted", label: "서류 제출" },
  { key: "reviewed", label: "검토 완료" },
  { key: "paid", label: "지급 완료" }
];

export function AdminDashboard({ initialSessions }: { initialSessions: SessionRecord[] }) {
  const [filter, setFilter] = useState<"all" | SessionStatus>("all");
  const [sessions, setSessions] = useState(initialSessions);

  const filteredSessions = useMemo(() => {
    return filter === "all" ? sessions : sessions.filter((session) => session.status === filter);
  }, [filter, sessions]);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-6 rounded-[32px] border border-white/70 bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">제출 현황</h1>
            <p className="mt-2 text-sm text-slate-500">
              강의 건 생성, 상태 확인, 삭제까지 여기서 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              className="inline-flex items-center rounded-full border border-soilab-navy/15 px-4 py-3 text-sm font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
              href="/api/export/reviewed"
            >
              검토완료 엑셀 다운로드
            </a>
            <SessionCreateDialog onCreated={(session) => setSessions((current) => [session, ...current])} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.key ? "bg-soilab-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">강의명</th>
                <th className="px-6 py-4 font-semibold">일정</th>
                <th className="px-6 py-4 font-semibold">대상자</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">발송 정보</th>
                <th className="px-6 py-4 font-semibold">제출일</th>
                <th className="px-6 py-4 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length ? (
                filteredSessions.map((session) => (
                  <tr className="border-t border-slate-100 text-slate-700" key={session.id}>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">{session.lecture_title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {session.business_name ? `${session.business_name} / ` : ""}
                        {session.lecture_place}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-700">{formatFee(session.fee)}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div>{formatDate(session.lecture_date)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {session.time_start} - {session.time_end}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div>{session.lecturer_name || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {session.lecturer_phone ? normalizePhone(session.lecturer_phone) : "연락처 미등록"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{session.lecturer_email || "이메일 미등록"}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(session.status)}`}
                      >
                        {getStatusLabel(session.status)}
                      </span>
                      {session.attachment_count ? (
                        <span className="ml-2 text-xs text-slate-400">첨부 {session.attachment_count}개</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-slate-500">
                      {session.link_sent_at ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700">{getNotificationChannelLabel(session.link_sent_via)} 발송</div>
                          <div>{formatDateTime(session.link_sent_at)}</div>
                        </div>
                      ) : session.last_notification_error ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-rose-600">발송 확인 필요</div>
                          <div className="max-w-[220px] break-words text-rose-500">{session.last_notification_error}</div>
                        </div>
                      ) : (
                        <span>미발송</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-slate-500">{formatDateTime(session.submitted_at)}</td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <SessionNotifyButton sessionId={session.id} />
                        <Link
                          className="inline-flex items-center rounded-full border border-soilab-navy/15 px-3 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                          href={`/admin/${session.id}`}
                        >
                          상세 보기
                        </Link>
                        <SessionDeleteButton sessionId={session.id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-16 text-center text-sm text-slate-400" colSpan={7}>
                    표시할 강의 건이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
