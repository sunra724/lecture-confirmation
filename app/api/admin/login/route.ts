import { NextResponse } from "next/server";
import { createAdminSession, isValidAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!body?.password || !isValidAdminPassword(body.password)) {
    return NextResponse.json({ message: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  createAdminSession();
  return NextResponse.json({ ok: true });
}
