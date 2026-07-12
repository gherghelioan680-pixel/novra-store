import type { NextRequest } from "next/server";
import {
  getImageFromStore,
  guessContentType,
  readPublicImageFallback,
  saveImageToStore,
} from "@/lib/images-server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const imagePath = request.nextUrl.searchParams.get("path");
  if (!imagePath) {
    return Response.json({ error: "Lipsește parametrul path." }, { status: 400 });
  }

  const stored = await getImageFromStore(imagePath);
  if (stored?.base64) {
    const buffer = Buffer.from(stored.base64, "base64");
    return new Response(buffer, {
      headers: {
        "Content-Type": stored.contentType || guessContentType(imagePath),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  const fallback = await readPublicImageFallback(imagePath);
  if (fallback) {
    return new Response(new Uint8Array(fallback.buffer), {
      headers: {
        "Content-Type": fallback.contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  return Response.json({ error: "Imagine negăsită." }, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const imagePath = typeof body?.path === "string" ? body.path : "";
    const base64 = typeof body?.base64 === "string" ? body.base64 : "";
    const contentType = typeof body?.contentType === "string" ? body.contentType : "";

    if (!imagePath || !base64) {
      return Response.json({ error: "Lipsește path sau conținutul imaginii." }, { status: 400 });
    }

    const result = await saveImageToStore(imagePath, base64, contentType);
    if (!result.ok) {
      return Response.json({ error: result.message }, { status: 400 });
    }

    return Response.json({
      ok: true,
      path: imagePath,
      url: `/api/store/images?path=${encodeURIComponent(imagePath)}`,
    });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}
