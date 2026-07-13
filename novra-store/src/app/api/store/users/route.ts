import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { User } from "@/lib/auth";
import { adminAdjustCredits } from "@/lib/credits-server";

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

    user.email = user.email.trim().toLowerCase();

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

    let user = users[index];

    if (typeof body.creditsDelta === "number" && body.creditsDelta !== 0) {
      const adjustResult = await adminAdjustCredits(
        email,
        body.creditsDelta,
        typeof body.adminNote === "string" ? body.adminNote : undefined
      );
      if (!adjustResult.ok) {
        return Response.json({ error: adjustResult.message }, { status: 400 });
      }
      user = adjustResult.user;
      users[index] = user;
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
      "banned",
    ] as const;

    for (const field of profileFields) {
      if (body[field] !== undefined) {
        (user as Record<string, unknown>)[field] = body[field];
      }
    }

    if (user.firstName || user.lastName) {
      user.name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name;
    }

    const creditsNoteUsed =
      typeof body.creditsDelta === "number" && body.creditsDelta !== 0 && typeof body.adminNote === "string";

    if (typeof body.adminNote === "string" && body.adminNote.trim() && !creditsNoteUsed) {
      const existing = user.adminNotes ?? "";
      const timestamp = new Date().toLocaleString("ro-RO");
      user.adminNotes = existing
        ? `${existing}\n[${timestamp}] ${body.adminNote.trim()}`
        : `[${timestamp}] ${body.adminNote.trim()}`;
    }

    users[index] = user;
    await writeJsonFile(FILE, users);
    return Response.json({ ok: true, user: stripPassword(user) });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
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

    if (users[index].role === "admin") {
      return Response.json({ error: "Nu poți șterge un cont de administrator." }, { status: 403 });
    }

    users.splice(index, 1);
    await writeJsonFile(FILE, users);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
