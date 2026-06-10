import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "lecture_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
  userId: string;
};

type AdminLoginInput = {
  email: string;
  password: string;
};

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new AdminAuthError("Supabase 인증 환경변수가 설정되지 않았습니다.", 500);
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[\s,]+/)
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isAllowedAdminEmail(email: string) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) {
    throw new AdminAuthError("관리자 이메일 허용 목록이 설정되지 않았습니다.", 500);
  }

  return adminEmails.includes(normalizeEmail(email));
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new AdminAuthError("관리자 세션 서명 키가 설정되지 않았습니다.", 500);
  }

  return secret;
}

function signSessionBody(body: string) {
  return createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(payload: AdminSessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signSessionBody(body);

  return `${body}.${signature}`;
}

function decodeSession(value?: string) {
  if (!value) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature || !safeEqual(signature, signSessionBody(body))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSessionPayload;
    if (!payload.email || !payload.userId || Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function authenticateAdmin(input: AdminLoginInput) {
  const email = normalizeEmail(input.email);
  if (!email || !input.password) {
    throw new AdminAuthError("이메일과 비밀번호를 입력해 주세요.");
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password
  });

  if (error || !data.user?.email) {
    throw new AdminAuthError("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  if (!isAllowedAdminEmail(data.user.email)) {
    throw new AdminAuthError("이 이메일은 관리자 권한이 없습니다.", 403);
  }

  return {
    email: normalizeEmail(data.user.email),
    userId: data.user.id
  };
}

export function createAdminSession(admin: { email: string; userId: string }) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;

  cookies().set(COOKIE_NAME, encodeSession({ ...admin, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
}

export function requireAdminSession() {
  return Boolean(decodeSession(cookies().get(COOKIE_NAME)?.value));
}
