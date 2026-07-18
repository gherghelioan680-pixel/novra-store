import type { NextRequest } from "next/server";
import {
  getSessionFromRequest,
  isAdminRequest,
  unauthorizedResponse,
} from "@/lib/server-auth";
import {
  deleteFriendReferral,
  ensureUserReferralCode,
  getReferralStats,
  linkRefereeOnRegister,
  readFriendReferrals,
  readReferralSettings,
  updateFriendReferral,
  writeReferralSettings,
} from "@/lib/referrals-server";
import type { ReferralSettings } from "@/lib/referrals-types";
import { readJsonFile } from "@/lib/server-data";
import type { User } from "@/lib/auth";

export const runtime = "nodejs";

const USERS_FILE = "users.json";

type StoredUser = User & { friendReferralCode?: string; referredByCode?: string };

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");

  if (scope === "admin") {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    const [referrals, settings, stats] = await Promise.all([
      readFriendReferrals(),
      readReferralSettings(),
      getReferralStats(),
    ]);
    return Response.json({ referrals, settings, stats });
  }

  const session = getSessionFromRequest(request);
  if (!session?.email) return unauthorizedResponse();

  const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
  const user = users.find((u) => u.email.toLowerCase() === session.email.toLowerCase());
  if (!user) return unauthorizedResponse();

  const referralCode = await ensureUserReferralCode(user);
  const referrals = await readFriendReferrals();
  const userReferrals = referrals.filter((r) => r.referrerUserId === user.id);
  const settings = await readReferralSettings();

  const origin = request.headers.get("origin") ?? "https://novra.ro";

  return Response.json({
    referralCode,
    inviteLink: `${origin.replace(/\/$/, "")}/?invite=${encodeURIComponent(referralCode)}`,
    referrals: userReferrals,
    settings,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "update-settings") {
      if (!isAdminRequest(request)) return unauthorizedResponse();
      const settings = body?.settings as ReferralSettings;
      if (!settings) {
        return Response.json({ ok: false, message: "Setări invalide." }, { status: 400 });
      }
      await writeReferralSettings(settings);
      return Response.json({ ok: true });
    }

    if (action === "link-on-register") {
      const session = getSessionFromRequest(request);
      if (!session?.email) return unauthorizedResponse();

      const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode : "";
      if (!inviteCode) return Response.json({ ok: true });

      const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === session.email.toLowerCase());
      if (!user) return unauthorizedResponse();

      await linkRefereeOnRegister(user, inviteCode);
      return Response.json({ ok: true });
    }

    if (action === "update-referral") {
      if (!isAdminRequest(request)) return unauthorizedResponse();
      const referralId = typeof body?.referralId === "string" ? body.referralId : "";
      if (!referralId) {
        return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
      }
      const result = await updateFriendReferral(referralId, {
        referrerEmail: typeof body?.referrerEmail === "string" ? body.referrerEmail : undefined,
        refereeEmail: typeof body?.refereeEmail === "string" ? body.refereeEmail : undefined,
        referrerRewarded:
          typeof body?.referrerRewarded === "boolean" ? body.referrerRewarded : undefined,
        refereeRewarded:
          typeof body?.refereeRewarded === "boolean" ? body.refereeRewarded : undefined,
      });
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, referral: result.referral });
    }

    if (action === "delete-referral") {
      if (!isAdminRequest(request)) return unauthorizedResponse();
      const referralId = typeof body?.referralId === "string" ? body.referralId : "";
      if (!referralId) {
        return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
      }
      const result = await deleteFriendReferral(referralId);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
