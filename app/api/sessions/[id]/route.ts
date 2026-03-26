import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deleteSession, getSession, updateSessionDetail } from "@/lib/db";
import type { SessionUpdateInput } from "@/lib/types";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const session = getSession(Number(params.id));
  return session
    ? NextResponse.json(session)
    : NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const ok = deleteSession(Number(params.id));
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SessionUpdateInput | null;
  if (
    !body ||
    !body.lecture_title?.trim() ||
    !body.lecture_date?.trim() ||
    !body.lecture_place?.trim() ||
    !body.time_start?.trim() ||
    !body.time_end?.trim() ||
    !body.lecturer_name?.trim() ||
    !body.lecturer_phone?.trim()
  ) {
    return NextResponse.json({ message: "수정에 필요한 값이 부족합니다." }, { status: 400 });
  }

  const detail = updateSessionDetail(Number(params.id), body);
  return detail
    ? NextResponse.json(detail)
    : NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
}
