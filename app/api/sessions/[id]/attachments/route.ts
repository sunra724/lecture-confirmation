import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  createAttachmentUpload,
  deleteAttachment,
  getAttachmentsBySubmissionId,
  getSessionDetail
} from "@/lib/db";

export const runtime = "nodejs";

const SINGLE_ATTACHMENT_TYPES = new Set(["bankbook", "id_card", "resume", "lecture_plan"]);
const ALL_ATTACHMENT_TYPES = new Set([...SINGLE_ATTACHMENT_TYPES, "supporting_document"]);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const detail = await getSessionDetail(Number(params.id));
  if (!detail) {
    return NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!detail.submission) {
    return NextResponse.json({ message: "아직 제출되지 않은 강의 건입니다." }, { status: 400 });
  }

  const formData = await request.formData();
  const fileType = String(formData.get("file_type") ?? "").trim();
  const file = formData.get("file");

  if (!ALL_ATTACHMENT_TYPES.has(fileType)) {
    return NextResponse.json({ message: "허용되지 않은 첨부 유형입니다." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "업로드할 파일을 선택해주세요." }, { status: 400 });
  }

  if (SINGLE_ATTACHMENT_TYPES.has(fileType)) {
    const existingAttachments = (await getAttachmentsBySubmissionId(detail.submission.id)).filter(
      (attachment) => attachment.file_type === fileType
    );
    for (const attachment of existingAttachments) {
      await deleteAttachment(attachment.id);
    }
  }

  await createAttachmentUpload({
    submissionId: detail.submission.id,
    fileType,
    file
  });

  return NextResponse.json({ ok: true });
}
