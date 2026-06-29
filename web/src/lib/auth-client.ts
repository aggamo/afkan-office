"use client";

const TOKEN_COOKIE = "afkan_token";

export function setAuthToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function getAuthToken(): string | null {
  const match = document.cookie.match(new RegExp(`${TOKEN_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
