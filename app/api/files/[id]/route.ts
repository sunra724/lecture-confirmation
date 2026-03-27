import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deleteAttachment, downloadAttachmentContent } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const result = await downloadAttachmentContent(Number(params.id));
  if (!result) {
    return NextResponse.json({ message: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const { attachment, fileBuffer, contentType: detectedContentType } = result;
  const extension = path.extname(attachment.original_name).toLowerCase();
  const contentType =
    detectedContentType !== "application/octet-stream"
      ? detectedContentType
      : extension === ".pdf"
      ? "application/pdf"
      : extension === ".png"
        ? "image/png"
        : extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.original_name)}"`
    }
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const ok = await deleteAttachment(Number(params.id));
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ message: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
}
