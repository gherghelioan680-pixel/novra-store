import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/i.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Samsung Internet / Chrome Android cache HTML aggressively without explicit headers.
  // Critical for Coming Soon toggle and other server-driven layout changes.
  if (!isStaticAsset(pathname)) {
    if (pathname.startsWith("/api")) {
      response.headers.set("Cache-Control", "no-store, must-revalidate");
    } else {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("CDN-Cache-Control", "no-store");
      response.headers.set("Vercel-CDN-Cache-Control", "no-store");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
