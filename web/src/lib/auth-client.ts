"use client";

const TOKEN_COOKIE = "afkan_token";
const ROLE_COOKIE = "afkan_role";

export function setAuthToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function setAuthRole(role: string) {
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}

export function getAuthToken(): string | null {
  const match = document.cookie.match(new RegExp(`${TOKEN_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

export function getAuthRole(): string | null {
  const match = document.cookie.match(new RegExp(`${ROLE_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
