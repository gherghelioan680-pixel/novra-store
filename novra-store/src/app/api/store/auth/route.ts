import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { getSessionFromRequest, isAdminRequest } from "@/lib/server-auth";
import type { User } from "@/lib/auth";
import {
  ensureUserReferralCode,
  linkRefereeOnRegister,
} from "@/lib/referrals-server";
import { normalizeReferralCode } from "@/lib/referrals-types";
import { BANNED_USER_MESSAGE } from "@/lib/user-ban-server";

export const runtime = "nodejs";

const FILE = "users.json";

type StoredUser = User & { adminNotes?: string };

const SIGNUP_CREDITS = 50;

function stripPassword(user: StoredUser): Omit<StoredUser, "password"> {
  const { password, ...safe } = user;
  void password;
  return safe;
}

function findUserIndex(users: StoredUser[], email: string): number {
  return users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase());
}

function buildAdminUser(name: string, email: string, password: string): StoredUser {
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: `admin-${Date.now()}`,
    name,
    firstName,
    lastName: lastName || undefined,
    email,
    password,
    role: "admin",
    phone: "",
    address: "",
    country: "Romania",
    paymentMethod: "",
    favoriteItems: [],
    orders: [],
    addresses: [],
    paymentMethods: [],
    novraCredits: 0,
    signupBonusClaimed: true,
    profileCompleted: true,
    subscribedToNewsletter: false,
    loyalty: {
      points: 0,
      discount: "0%",
    },
    preferences: {
      offers: false,
      orders: true,
      recommendations: false,
    },
    createdAt: new Date().toISOString(),
  };
}

function buildRegisterUser(name: string, email: string, password: string): StoredUser {
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: `${Date.now()}`,
    name,
    firstName,
    lastName: lastName || undefined,
    email,
    password,
    phone: "",
    address: "",
    country: "Romania",
    paymentMethod: "",
    favoriteItems: [],
    orders: [],
    addresses: [],
    paymentMethods: [],
    novraCredits: SIGNUP_CREDITS,
    signupBonusClaimed: true,
    profileCompleted: false,
    subscribedToNewsletter: false,
    loyalty: {
      points: SIGNUP_CREDITS,
      discount: "0%",
    },
    preferences: {
      offers: true,
      orders: true,
      recommendations: false,
    },
    role: "customer",
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "register") {
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password.trim() : "";

      if (!name || !email || !password) {
        return Response.json(
          { success: false, message: "Completează toate câmpurile." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      if (findUserIndex(users, email) !== -1) {
        return Response.json(
          { success: false, message: "Există deja un cont cu acest email." },
          { status: 409 }
        );
      }

      const bannedExisting = users.find((u) => u.email.toLowerCase() === email && u.banned);
      if (bannedExisting) {
        return Response.json(
          { success: false, message: BANNED_USER_MESSAGE },
          { status: 403 }
        );
      }

      const newUser = buildRegisterUser(name, email, password);
      const inviteCode =
        typeof body?.inviteCode === "string" ? normalizeReferralCode(body.inviteCode) : "";
      if (inviteCode) {
        (newUser as StoredUser).referredByCode = inviteCode;
      }

      users.push(newUser);
      await writeJsonFile(FILE, users);

      await ensureUserReferralCode(newUser as StoredUser);
      if (inviteCode) {
        await linkRefereeOnRegister(newUser as StoredUser, inviteCode);
      }

      return Response.json({
        success: true,
        message: "Cont creat cu succes! Ai primit 50 NovraCredits.",
        user: stripPassword(newUser),
      });
    }

    if (action === "login") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password.trim() : "";

      if (!email || !password) {
        return Response.json(
          { success: false, message: "Completează emailul și parola." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const user = users.find(
        (item) => item.email.toLowerCase() === email && item.password === password
      );

      if (!user) {
        return Response.json(
          { success: false, message: "Date de autentificare incorecte." },
          { status: 401 }
        );
      }

      if (user.banned) {
        return Response.json(
          { success: false, message: BANNED_USER_MESSAGE },
          { status: 403 }
        );
      }

      return Response.json({
        success: true,
        message: "Autentificare reușită!",
        user: stripPassword(user),
      });
    }

    if (action === "admin-login") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password.trim() : "";

      if (!email || !password) {
        return Response.json(
          { success: false, message: "Completează emailul și parola." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const user = users.find(
        (item) =>
          item.email.toLowerCase() === email &&
          item.password === password &&
          item.role === "admin"
      );

      if (!user) {
        return Response.json(
          { success: false, message: "Acces refuzat. Doar administratorii pot intra aici." },
          { status: 401 }
        );
      }

      return Response.json({
        success: true,
        message: "Autentificare admin reușită!",
        user: stripPassword(user),
      });
    }

    if (action === "create-admin") {
      if (!isAdminRequest(request)) {
        return Response.json(
          { success: false, message: "Acces refuzat. Doar administratorii pot crea conturi admin." },
          { status: 401 }
        );
      }

      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password.trim() : "";

      if (!name || !email || !password) {
        return Response.json(
          { success: false, message: "Completează numele, emailul și parola." },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return Response.json(
          { success: false, message: "Parola trebuie să aibă cel puțin 6 caractere." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const existingIndex = findUserIndex(users, email);

      if (existingIndex !== -1) {
        const existing = users[existingIndex];
        if (existing.role === "admin") {
          return Response.json(
            { success: false, message: "Există deja un administrator cu acest email." },
            { status: 409 }
          );
        }

        existing.role = "admin";
        existing.password = password;
        existing.name = name;
        const nameParts = name.split(/\s+/);
        existing.firstName = nameParts[0] ?? name;
        existing.lastName = nameParts.slice(1).join(" ") || undefined;
        existing.profileCompleted = true;

        await writeJsonFile(FILE, users);
        return Response.json({
          success: true,
          message: "Contul existent a fost promovat la administrator.",
          user: stripPassword(existing),
        });
      }

      const newAdmin = buildAdminUser(name, email, password);
      users.push(newAdmin);
      await writeJsonFile(FILE, users);

      return Response.json({
        success: true,
        message: "Administrator creat cu succes.",
        user: stripPassword(newAdmin),
      });
    }

    if (action === "check-email") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) {
        return Response.json({ exists: false }, { status: 400 });
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const exists = findUserIndex(users, email) !== -1;
      return Response.json({ exists });
    }

    return Response.json({ success: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "StorageUnavailableError") {
      return Response.json(
        {
          success: false,
          message:
            "Serverul nu poate salva conturile momentan. Contactează suportul sau încearcă mai târziu.",
        },
        { status: 503 }
      );
    }

    return Response.json(
      { success: false, message: "Cerere invalidă. Încearcă din nou." },
      { status: 400 }
    );
  }
}
