import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";

export async function POST() {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  return NextResponse.json({ message: "일괄 등록은 다음 단계에서 복원할 예정입니다." }, { status: 501 });
}
