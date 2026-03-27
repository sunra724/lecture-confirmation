import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createSession, listSessions, seedExampleSession } from "@/lib/db";
import type { SessionInput } from "@/lib/types";

export async function GET() {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  await seedExampleSession();
  return NextResponse.json(await listSessions());
}

export async function POST(request: Request) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const body = (await request.json()) as SessionInput;
  const created = await createSession(body);
  return NextResponse.json(created, { status: 201 });
}
