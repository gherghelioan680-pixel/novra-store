import { cookies, headers } from "next/headers";
import ComingSoonAdminBanner from "@/components/ComingSoonAdminBanner";
import ComingSoonPage from "@/components/ComingSoonPage";
import { getInitialTimeLeftForDate } from "@/lib/countdown";
import { parseIsoDate } from "@/lib/datetime";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { parseSessionRaw, type SessionData } from "@/lib/server-auth";

const DEFAULT_COMING_SOON_COUNTDOWN = "2026-08-11T23:59:59+03:00";

import { stripLocalePrefix } from "@/lib/locale-path";

function isExemptPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next")
  );
}

function getRequestPathname(headersList: Headers): string {
  const fromProxy =
    headersList.get("x-pathname") ??
    headersList.get("x-invoke-path") ??
    headersList.get("x-middleware-request-x-pathname");

  if (fromProxy) return fromProxy;

  const urlHeader = headersList.get("x-url") ?? headersList.get("next-url");
  if (urlHeader) {
    try {
      return new URL(urlHeader, "https://novra.ro").pathname;
    } catch {
      /* ignore malformed header */
    }
  }

  return "/";
}

async function getSessionFromCookies(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("novra-session")?.value;
  if (!raw) return null;
  return parseSessionRaw(raw);
}

export default async function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = getRequestPathname(headersList);

  if (isExemptPath(pathname)) {
    return children;
  }

  const settings = await getServerSiteSettings();

  if (settings.comingSoon.enabled !== true) {
    return children;
  }

  const session = await getSessionFromCookies();
  const isAdmin = session?.role === "admin";

  if (isAdmin) {
    return (
      <>
        <ComingSoonAdminBanner />
        <div className="pt-10">{children}</div>
      </>
    );
  }

  const countdownTarget = parseIsoDate(
    settings.comingSoon.countdownDate ?? DEFAULT_COMING_SOON_COUNTDOWN
  );
  const initialTimeLeft = getInitialTimeLeftForDate(countdownTarget);

  return (
    <ComingSoonPage
      settings={settings.comingSoon}
      whatsappNumber={settings.whatsappNumber}
      instagramUrl={settings.instagramUrl}
      initialTimeLeft={initialTimeLeft}
      newsletterDiscountPercent={settings.newsletterDiscountPercent ?? 10}
    />
  );
}
