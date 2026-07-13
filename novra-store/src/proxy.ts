import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/i.test(pathname)
  );
}

function applyCacheHeaders(response: NextResponse, pathname: string) {
  if (isStaticAsset(pathname)) return;

  if (pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  } else {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = handleI18nRouting(
    new NextRequest(request.url, {
      headers: requestHeaders,
    }),
  );

  applyCacheHeaders(response, pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
