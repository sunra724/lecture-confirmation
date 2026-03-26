import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getSession, markSessionNotification } from "@/lib/db";
import { sendSessionLinkNotification, type NotificationChannel } from "@/lib/notify";

function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const session = getSession(Number(params.id));
  if (!session) {
    return NextResponse.json({ message: "강의 건을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { channel?: NotificationChannel } | null;
  const channel = body?.channel ?? "combined";
  const origin = getRequestOrigin(request);

  try {
    const result = await sendSessionLinkNotification(session, channel, origin);
    markSessionNotification({ id: session.id, via: result.channel });
    return NextResponse.json({
      ok: true,
      channel: result.channel,
      link: result.link
    });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "링크 발송에 실패했습니다.";
    markSessionNotification({ id: session.id, via: channel, error: message });
    return NextResponse.json({ message }, { status: 500 });
  }
}
