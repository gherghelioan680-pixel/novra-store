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
import { createEmptyDeliveryMapPayload } from "@/lib/delivery-map";

export const runtime = "nodejs";

const SETTINGS_FILE = "settings.json";

export async function GET(request: NextRequest) {
  try {
    const payload = await getPublicDeliveryMap();

    if (isAdminRequest(request)) {
      const map = await readDeliveryMap();
      return Response.json({
        ...map,
        enabled: payload.enabled,
        publicEnabled: payload.enabled,
        totalOrders: payload.totalOrders,
      });
    }

    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[delivery-map] GET failed:", error);
    const fallback = createEmptyDeliveryMapPayload(true);
    return Response.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }
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
