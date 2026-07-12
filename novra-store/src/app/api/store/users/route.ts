import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { User } from "@/lib/auth";

export const runtime = "nodejs";

const FILE = "users.json";

type StoredUser = User & { adminNotes?: string };

function stripPassword(user: StoredUser): Omit<StoredUser, "password"> {
  const { password, ...safe } = user;
  void password;
  return safe;
}

function findUserIndex(users: StoredUser[], email: string): number {
  return users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const emailParam = request.nextUrl.searchParams.get("email");
  const users = await readJsonFile<StoredUser[]>(FILE, []);

  if (emailParam) {
    const user = users.find((u) => u.email.toLowerCase() === emailParam.toLowerCase());
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (isAdminRequest(request)) {
      return Response.json({ user: stripPassword(user) });
    }

    if (session?.email.toLowerCase() === emailParam.toLowerCase()) {
      return Response.json({ user: stripPassword(user) });
    }

    return unauthorizedResponse();
  }

  if (!isAdminRequest(request)) return unauthorizedResponse();

  return Response.json({ users: users.map(stripPassword) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = body?.user as StoredUser | undefined;
    if (!user?.email || !user.id) {
      return Response.json({ error: "Invalid user data" }, { status: 400 });
    }

    const users = await readJsonFile<StoredUser[]>(FILE, []);
    const index = findUserIndex(users, user.email);

    if (index === -1) {
      users.push(user);
    } else {
      users[index] = { ...users[index], ...user, password: user.password || users[index].password };
    }

    await writeJsonFile(FILE, users);
    return Response.json({ ok: true, user: stripPassword(users[index === -1 ? users.length - 1 : index]) });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    const users = await readJsonFile<StoredUser[]>(FILE, []);
    const index = findUserIndex(users, email);
    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const current = users[index];

    if (typeof body.creditsDelta === "number") {
      const currentCredits = current.novraCredits ?? current.loyalty?.points ?? 0;
      const newCredits = Math.max(0, currentCredits + body.creditsDelta);
      current.novraCredits = newCredits;
      current.loyalty = { ...current.loyalty, points: newCredits, discount: current.loyalty?.discount ?? "0%" };
    }

    const profileFields = [
      "firstName",
      "lastName",
      "name",
      "phone",
      "dateOfBirth",
      "country",
      "address",
      "shippingAddress",
      "subscribedToNewsletter",
      "preferences",
    ] as const;

    for (const field of profileFields) {
      if (body[field] !== undefined) {
        (current as Record<string, unknown>)[field] = body[field];
      }
    }

    if (current.firstName || current.lastName) {
      current.name = [current.firstName, current.lastName].filter(Boolean).join(" ").trim() || current.name;
    }

    if (typeof body.adminNote === "string" && body.adminNote.trim()) {
      const existing = current.adminNotes ?? "";
      const timestamp = new Date().toLocaleString("ro-RO");
      current.adminNotes = existing
        ? `${existing}\n[${timestamp}] ${body.adminNote.trim()}`
        : `[${timestamp}] ${body.adminNote.trim()}`;
    }

    users[index] = current;
    await writeJsonFile(FILE, users);
    return Response.json({ ok: true, user: stripPassword(current) });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
