const SESSION_STORAGE_KEY = "novra-visitor-session";
const HEARTBEAT_INTERVAL_MS = 60_000;

export function getOrCreateVisitorSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = `vs-${crypto.randomUUID()}`;
      window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `vs-${Date.now()}`;
  }
}

export async function sendVisitorHeartbeat(): Promise<void> {
  const sessionId = getOrCreateVisitorSessionId();
  if (!sessionId) return;

  try {
    await fetch("/api/store/visitors/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      cache: "no-store",
    });
  } catch {
    /* ignore */
  }
}

export function startVisitorHeartbeat(): () => void {
  void sendVisitorHeartbeat();
  const timerId = window.setInterval(() => void sendVisitorHeartbeat(), HEARTBEAT_INTERVAL_MS);
  return () => window.clearInterval(timerId);
}
