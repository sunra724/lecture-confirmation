import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { updateSessionStatus } from "@/lib/db";
import type { SessionStatus } from "@/lib/types";

const ALLOWED_STATUSES: SessionStatus[] = ["pending", "submitted", "reviewed", "paid"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { status?: SessionStatus } | null;
  if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ message: "유효한 상태값이 아닙니다." }, { status: 400 });
  }

  const session = updateSessionStatus(Number(params.id), body.status);
  return session
    ? NextResponse.json(session)
    : NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
}
