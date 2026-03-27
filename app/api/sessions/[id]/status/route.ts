import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getSession, updateSessionStatus } from "@/lib/db";
import { sendPaymentCompletedNotification } from "@/lib/notify";
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

  const session = await updateSessionStatus(Number(params.id), body.status);
  if (!session) {
    return NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
  }

  if (body.status === "paid") {
    try {
      const currentSession = await getSession(Number(params.id));
      if (currentSession) {
        await sendPaymentCompletedNotification(currentSession);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? `지급 완료로 변경되었지만 문자 통보는 실패했습니다. ${caughtError.message}`
          : "지급 완료로 변경되었지만 문자 통보는 실패했습니다.";
      return NextResponse.json({ ...session, message }, { status: 200 });
    }
  }

  return NextResponse.json(session);
}
