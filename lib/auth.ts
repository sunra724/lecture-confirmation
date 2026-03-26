import { cookies } from "next/headers";

const COOKIE_NAME = "lecture_admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "soilab2024";
}

export function isValidAdminPassword(password: string) {
  return password === getAdminPassword();
}

export function createAdminSession() {
  cookies().set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
}

export function requireAdminSession() {
  return cookies().get(COOKIE_NAME)?.value === "authenticated";
}
