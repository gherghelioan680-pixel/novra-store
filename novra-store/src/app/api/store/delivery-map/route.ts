import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  adjustCountyCount,
  getPublicDeliveryMap,
  readDeliveryMap,
  resetDeliveryMapStats,
  setCountyExcluded,
} from "@/lib/delivery-map-server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";

const SETTINGS_FILE = "settings.json";

export async function GET(request: NextRequest) {
  if (isAdminRequest(request)) {
    const [map, settings] = await Promise.all([readDeliveryMap(), getPublicDeliveryMap()]);
    return Response.json({
      ...map,
      publicEnabled: settings.enabled,
    });
  }

  const payload = await getPublicDeliveryMap();
  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body?.action === "reset") {
      const map = await resetDeliveryMapStats();
      revalidatePath("/harta-livrari", "page");
      return Response.json({ ok: true, ...map, publicEnabled: true });
    }

    if (body?.action === "togglePublic") {
      const current = await readJsonFile<Partial<SiteSettings>>(SETTINGS_FILE, DEFAULT_SETTINGS);
      const nextEnabled = body.enabled !== false;
      const next = mergeSettings({
        ...current,
        deliveryMapPublicEnabled: nextEnabled,
      });
      await writeJsonFile(SETTINGS_FILE, next);
      revalidatePath("/harta-livrari", "page");
      return Response.json({ ok: true, publicEnabled: nextEnabled });
    }

    if (body?.action === "exclude") {
      const countyCode = typeof body.countyCode === "string" ? body.countyCode : "";
      if (!countyCode) {
        return Response.json({ ok: false, message: "Județ invalid." }, { status: 400 });
      }
      const map = await setCountyExcluded(countyCode, body.excluded !== false);
      revalidatePath("/harta-livrari", "page");
      return Response.json({ ok: true, ...map });
    }

    if (body?.action === "adjustCount") {
      const countyCode = typeof body.countyCode === "string" ? body.countyCode : "";
      const orderCount = Number(body.orderCount);
      if (!countyCode || !Number.isFinite(orderCount)) {
        return Response.json({ ok: false, message: "Date invalide." }, { status: 400 });
      }
      const map = await adjustCountyCount(countyCode, orderCount);
      revalidatePath("/harta-livrari", "page");
      return Response.json({ ok: true, ...map });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cerere invalidă.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}
