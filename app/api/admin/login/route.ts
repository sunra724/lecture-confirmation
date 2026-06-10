import { NextResponse } from "next/server";
import { AdminAuthError, authenticateAdmin, createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;

  try {
    const admin = await authenticateAdmin({
      email: body?.email ?? "",
      password: body?.password ?? ""
    });

    createAdminSession(admin);
    return NextResponse.json({ ok: true });
  } catch (caughtError) {
    if (caughtError instanceof AdminAuthError) {
      return NextResponse.json({ message: caughtError.message }, { status: caughtError.status });
    }

    return NextResponse.json({ message: "관리자 로그인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
