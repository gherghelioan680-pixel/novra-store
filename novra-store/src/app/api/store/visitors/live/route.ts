import { getLiveVisitorCount } from "@/lib/visitors-server";

export const runtime = "nodejs";

export async function GET() {
  const count = await getLiveVisitorCount();
  return Response.json({ count });
}
