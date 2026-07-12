import "server-only";

import { connection } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/site-settings";

const FILE = "settings.json";

export async function getServerSiteSettings(): Promise<SiteSettings> {
  await connection();
  const stored = await readJsonFile<Partial<SiteSettings>>(FILE, DEFAULT_SETTINGS);
  return mergeSettings(stored);
}
