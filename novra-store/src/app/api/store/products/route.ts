import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { ProductOverride } from "@/lib/catalog";
import {
  createCustomProduct,
  deleteCustomProduct,
  readCustomProducts,
  updateCustomProduct,
  type CustomProductInput,
} from "@/lib/products-server";

export const runtime = "nodejs";

const FILE = "products.json";

type ProductsPayload = Record<string, ProductOverride>;

async function readOverrides(): Promise<ProductsPayload> {
  return readJsonFile<ProductsPayload>(FILE, {});
}

export async function GET(request: NextRequest) {
  const overrides = await readOverrides();
  const customProducts = await readCustomProducts();
  const admin = isAdminRequest(request);

  return Response.json({
    overrides,
    customProducts: admin ? customProducts : customProducts.filter((product) => product.active !== false),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body && typeof body === "object" && "action" in body) {
      const action = String(body.action);

      if (action === "create") {
        const product = body.product as CustomProductInput;
        const result = await createCustomProduct(product);
        if (!result.ok) {
          return Response.json({ ok: false, message: result.message }, { status: 400 });
        }
        const customProducts = await readCustomProducts();
        return Response.json({ ok: true, product: result.product, customProducts });
      }

      if (action === "update") {
        const product = body.product as CustomProductInput & { id: string };
        if (!product?.id) {
          return Response.json({ ok: false, message: "ID produs lipsă." }, { status: 400 });
        }
        const result = await updateCustomProduct(product);
        if (!result.ok) {
          return Response.json({ ok: false, message: result.message }, { status: 400 });
        }
        const customProducts = await readCustomProducts();
        return Response.json({ ok: true, product: result.product, customProducts });
      }

      return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
    }

    if (body && typeof body === "object" && "productId" in body && "updates" in body) {
      const productId = String(body.productId);
      const updates = body.updates as ProductOverride;
      const current = await readOverrides();
      current[productId] = { ...current[productId], ...updates };
      await writeJsonFile(FILE, current);
      const customProducts = await readCustomProducts();
      return Response.json({ overrides: current, customProducts });
    }

    if (body && typeof body === "object" && "overrides" in body) {
      const overrides = body.overrides as ProductsPayload;
      await writeJsonFile(FILE, overrides);
      const customProducts = await readCustomProducts();
      return Response.json({ overrides, customProducts });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const product = body?.product as (CustomProductInput & { id: string }) | undefined;
    if (!product?.id) {
      return Response.json({ ok: false, message: "ID produs lipsă." }, { status: 400 });
    }

    const result = await updateCustomProduct(product);
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }

    const customProducts = await readCustomProducts();
    return Response.json({ ok: true, product: result.product, customProducts });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID produs lipsă." }, { status: 400 });
    }

    const result = await deleteCustomProduct(id);
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 404 });
    }

    const customProducts = await readCustomProducts();
    return Response.json({ ok: true, customProducts });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
