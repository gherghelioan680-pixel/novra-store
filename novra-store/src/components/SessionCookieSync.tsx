"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "novra-session";

function getStoredSessionRole(): "admin" | "customer" | null {
  try {
    const session = window.localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const parsed = JSON.parse(session) as { role?: string };
    return parsed.role === "admin" ? "admin" : parsed.role === "customer" ? "customer" : null;
  } catch {
    return null;
  }
}

function syncSessionCookieFromStorage(): boolean {
  try {
    const session = window.localStorage.getItem(SESSION_KEY);
    const maxAge = 60 * 60 * 24 * 30;

    if (session) {
      const value = encodeURIComponent(session);
      document.cookie = `novra-session=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
      return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}

export default function SessionCookieSync() {
  const router = useRouter();

  useEffect(() => {
    const hadSession = syncSessionCookieFromStorage();
    if (hadSession && getStoredSessionRole() === "admin") {
      router.refresh();
    }
  }, [router]);

  return null;
}
