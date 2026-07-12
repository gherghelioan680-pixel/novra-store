import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  deleteCampaign,
  findCampaignBySlug,
  getActiveCampaignsServer,
  readCampaigns,
  upsertCampaign,
} from "@/lib/campaigns-server";
import type { LandingCampaign } from "@/lib/campaigns-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const activeOnly = request.nextUrl.searchParams.get("active") === "1";

  if (slug) {
    const campaign = await findCampaignBySlug(slug);
    if (!campaign) {
      return Response.json({ campaign: null }, { status: 404 });
    }
    return Response.json({ campaign });
  }

  const campaigns = activeOnly ? await getActiveCampaignsServer() : await readCampaigns();
  return Response.json({ campaigns });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "upsert") {
      const campaign = body?.campaign as Partial<LandingCampaign> & { slug: string };
      if (!campaign?.slug) {
        return Response.json({ ok: false, message: "Slug obligatoriu." }, { status: 400 });
      }
      const result = await upsertCampaign(campaign);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, campaign: result.campaign });
    }

    if (action === "delete") {
      const id = body?.id as string | undefined;
      if (!id) {
        return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
      }
      const result = await deleteCampaign(id);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
