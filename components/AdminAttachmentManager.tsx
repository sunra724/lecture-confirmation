"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttachmentRecord } from "@/lib/types";
import { getAttachmentLabel } from "@/lib/utils";

type SingleAttachmentType = "bankbook" | "id_card" | "resume" | "lecture_plan";

const SINGLE_ATTACHMENT_TYPES: SingleAttachmentType[] = ["id_card", "bankbook", "resume", "lecture_plan"];

export function AdminAttachmentManager({
  sessionId,
  attachments
}: {
  sessionId: number;
  attachments: AttachmentRecord[];
}) {
  const router = useRouter();
  const supportingDocuments = attachments.filter((attachment) => attachment.file_type === "supporting_document");
  const attachmentMap = Object.fromEntries(
    attachments
      .filter((attachment) => attachment.file_type !== "supporting_document")
      .map((attachment) => [attachment.file_type, attachment])
  ) as Partial<Record<SingleAttachmentType, AttachmentRecord>>;

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const singleInputRefs = {
    id_card: useRef<HTMLInputElement | null>(null),
    bankbook: useRef<HTMLInputElement | null>(null),
    resume: useRef<HTMLInputElement | null>(null),
    lecture_plan: useRef<HTMLInputElement | null>(null)
  };
  const supportingInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadSingle(fileType: SingleAttachmentType, file: File | null) {
    if (!file) return;
    const actionLabel = attachmentMap[fileType] ? "교체" : "업로드";
    setLoadingKey(`${fileType}-upload`);
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("file_type", fileType);
      formData.set("file", file);

      const response = await fetch(`/api/sessions/${sessionId}/attachments`, {
        method: "POST",
        body: formData
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message ?? `${getAttachmentLabel(fileType)} ${actionLabel}에 실패했습니다.`);
      }

      setMessage(`${getAttachmentLabel(fileType)} ${actionLabel}을 완료했습니다.`);
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "첨부파일 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingKey(null);
    }
  }

  async function uploadSupporting(files: FileList | null) {
    if (!files?.length) return;
    setLoadingKey("supporting-upload");
    setMessage("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("file_type", "supporting_document");
        formData.set("file", file);

        const response = await fetch(`/api/sessions/${sessionId}/attachments`, {
          method: "POST",
          body: formData
        });

        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          throw new Error(data?.message ?? "기타 증빙서류 업로드에 실패했습니다.");
        }
      }

      setMessage("기타 증빙서류 업로드를 완료했습니다.");
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "첨부파일 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingKey(null);
      if (supportingInputRef.current) {
        supportingInputRef.current.value = "";
      }
    }
  }

  async function removeAttachment(attachmentId: number, label: string) {
    if (!window.confirm(`${label} 파일을 삭제할까요?`)) return;

    setLoadingKey(`delete-${attachmentId}`);
    setMessage("");

    try {
      const response = await fetch(`/api/files/${attachmentId}`, {
        method: "DELETE"
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message ?? "첨부파일 삭제에 실패했습니다.");
      }

      setMessage(`${label} 파일을 삭제했습니다.`);
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "첨부파일 삭제에 실패했습니다.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">첨부파일 관리</h2>
      <p className="mt-2 text-sm text-slate-500">
        강사가 잘못 제출한 파일은 여기서 교체하거나 삭제할 수 있습니다.
      </p>

      <div className="mt-5 space-y-4">
        {SINGLE_ATTACHMENT_TYPES.map((fileType) => {
          const attachment = attachmentMap[fileType];
          const label = getAttachmentLabel(fileType);
          return (
            <div className="rounded-3xl border border-slate-200 p-4" key={fileType}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {attachment ? attachment.original_name : "아직 업로드되지 않았습니다."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachment ? (
                    <>
                      <a
                        className="inline-flex items-center rounded-full border border-soilab-navy/15 px-4 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                        href={`/api/files/${attachment.id}`}
                      >
                        다운로드
                      </a>
                      <button
                        className="inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loadingKey === `delete-${attachment.id}`}
                        onClick={() => removeAttachment(attachment.id, label)}
                        type="button"
                      >
                        삭제
                      </button>
                    </>
                  ) : null}
                  <button
                    className="inline-flex items-center rounded-full bg-soilab-navy px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={loadingKey === `${fileType}-upload`}
                    onClick={() => singleInputRefs[fileType].current?.click()}
                    type="button"
                  >
                    {loadingKey === `${fileType}-upload` ? "처리 중..." : attachment ? "교체 업로드" : "파일 업로드"}
                  </button>
                  <input
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      void uploadSingle(fileType, event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                    ref={singleInputRefs[fileType]}
                    type="file"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-3xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">기타 증빙서류</div>
              <div className="mt-1 text-xs text-slate-500">학위증명서, 경력증명서, 자격증 등 여러 개를 추가로 올릴 수 있습니다.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center rounded-full bg-soilab-navy px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={loadingKey === "supporting-upload"}
                onClick={() => supportingInputRef.current?.click()}
                type="button"
              >
                {loadingKey === "supporting-upload" ? "업로드 중..." : "기타 증빙 추가"}
              </button>
              <input
                accept="image/*,.pdf"
                className="hidden"
                multiple
                onChange={(event) => void uploadSupporting(event.target.files)}
                ref={supportingInputRef}
                type="file"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {supportingDocuments.length ? (
              supportingDocuments.map((attachment, index) => (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" key={attachment.id}>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">기타 증빙서류 {index + 1}</div>
                    <div className="mt-1 text-xs text-slate-500">{attachment.original_name}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="inline-flex items-center rounded-full border border-soilab-navy/15 px-4 py-2 text-xs font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
                      href={`/api/files/${attachment.id}`}
                    >
                      다운로드
                    </a>
                    <button
                      className="inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loadingKey === `delete-${attachment.id}`}
                      onClick={() => removeAttachment(attachment.id, `기타 증빙서류 ${index + 1}`)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
                업로드된 기타 증빙서류가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
