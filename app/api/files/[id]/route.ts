import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deleteAttachment, getAttachment } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const attachment = getAttachment(Number(params.id));
  if (!attachment) {
    return NextResponse.json({ message: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!fs.existsSync(attachment.file_path)) {
    return NextResponse.json({ message: "파일이 존재하지 않습니다." }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(attachment.file_path);
  const extension = path.extname(attachment.original_name).toLowerCase();
  const contentType =
    extension === ".pdf"
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

  const ok = deleteAttachment(Number(params.id));
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ message: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
}
