import type { NextRequest } from "next/server";
import { readJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { normalizeOrder, type Order } from "@/lib/orders";
import {
  createReturnRequest,
  readReturns,
  updateReturnStatus,
} from "@/lib/returns-server";
import type { ReturnStatus } from "@/lib/returns-types";
import {
  sendReturnRequestAdminEmail,
  trySendReturnStatusEmails,
} from "@/lib/email";

export const runtime = "nodejs";

const ORDERS_FILE = "orders.json";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const returns = await readReturns();

  if (isAdminRequest(request)) {
    return Response.json({ returns });
  }

  const email = session.email.toLowerCase();
  return Response.json({
    returns: returns.filter((item) => item.userEmail === email),
  });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const orderCode = typeof body?.orderCode === "string" ? body.orderCode.trim() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";

    if (!orderCode || !reason || !description) {
      return Response.json(
        { success: false, message: "Completează codul comenzii, motivul și descrierea." },
        { status: 400 }
      );
    }

    const ordersRaw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
    const orders = ordersRaw.map(normalizeOrder);
    const order = orders.find(
      (item) =>
        item.purchaseCode.toUpperCase() === orderCode.toUpperCase() &&
        item.userEmail.toLowerCase() === session.email.toLowerCase()
    );

    if (!order) {
      return Response.json(
        { success: false, message: "Comanda nu a fost găsită sau nu aparține contului tău." },
        { status: 404 }
      );
    }

    const existing = (await readReturns()).find(
      (item) =>
        item.orderCode.toUpperCase() === orderCode.toUpperCase() &&
        item.userEmail === session.email.toLowerCase() &&
        item.status !== "rejected"
    );
    if (existing) {
      return Response.json(
        { success: false, message: "Există deja o cerere de retur pentru această comandă." },
        { status: 409 }
      );
    }

    const entry = await createReturnRequest({
      orderCode: order.purchaseCode,
      userEmail: session.email,
      userName: order.userName,
      reason,
      description,
    });

    void sendReturnRequestAdminEmail(entry);

    return Response.json({ success: true, returnRequest: entry });
  } catch {
    return Response.json({ success: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = body?.status as ReturnStatus | undefined;
    const adminNote = typeof body?.adminNote === "string" ? body.adminNote.trim() : undefined;

    if (!id || !status) {
      return Response.json({ success: false, message: "Date incomplete." }, { status: 400 });
    }

    const valid: ReturnStatus[] = ["pending", "approved", "rejected", "completed"];
    if (!valid.includes(status)) {
      return Response.json({ success: false, message: "Status invalid." }, { status: 400 });
    }

    const returns = await readReturns();
    const existing = returns.find((item) => item.id === id);
    if (!existing) {
      return Response.json({ success: false, message: "Cererea nu a fost găsită." }, { status: 404 });
    }

    const updated = await updateReturnStatus(id, status, adminNote);
    if (!updated) {
      return Response.json({ success: false, message: "Cererea nu a fost găsită." }, { status: 404 });
    }

    void trySendReturnStatusEmails(updated, existing.status);

    return Response.json({ success: true, returnRequest: updated });
  } catch {
    return Response.json({ success: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
