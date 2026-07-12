const SESSION_KEY = "novra-session";

export function getApiHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    try {
      const session = window.localStorage.getItem(SESSION_KEY);
      if (session) headers["X-Novra-Session"] = session;
    } catch {
      /* ignore */
    }
  }

  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        ...getApiHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
