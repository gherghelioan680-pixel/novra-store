import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { ProductOverride } from "@/lib/catalog";

export const runtime = "nodejs";

const FILE = "products.json";

type ProductsPayload = Record<string, ProductOverride>;

export async function GET() {
  const overrides = await readJsonFile<ProductsPayload>(FILE, {});
  return Response.json({ overrides });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body && typeof body === "object" && "productId" in body && "updates" in body) {
      const productId = String(body.productId);
      const updates = body.updates as ProductOverride;
      const current = await readJsonFile<ProductsPayload>(FILE, {});
      current[productId] = { ...current[productId], ...updates };
      await writeJsonFile(FILE, current);
      return Response.json({ overrides: current });
    }

    if (body && typeof body === "object" && "overrides" in body) {
      const overrides = body.overrides as ProductsPayload;
      await writeJsonFile(FILE, overrides);
      return Response.json({ overrides });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
