import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";

const FILE = "settings.json";

export async function GET() {
  const stored = await readJsonFile<Partial<SiteSettings>>(FILE, DEFAULT_SETTINGS);
  return Response.json(mergeSettings(stored));
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const current = await readJsonFile<Partial<SiteSettings>>(FILE, DEFAULT_SETTINGS);
    const next = mergeSettings({ ...current, ...body });
    await writeJsonFile(FILE, next);
    return Response.json(next);
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
