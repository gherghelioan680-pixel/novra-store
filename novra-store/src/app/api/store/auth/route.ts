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
import {
  getServerAdminCredentials,
  hashPassword,
  migratePasswordIfNeeded,
} from "@/lib/password-server";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  isPasswordResetConfigured,
} from "@/lib/password-reset-server";
import { sendPasswordResetEmail } from "@/lib/email";
import { getStripeCheckoutOrigin } from "@/lib/stripe-server";

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

async function ensureDefaultAdmin(users: StoredUser[]): Promise<boolean> {
  const creds = getServerAdminCredentials();
  if (!creds) return false;

  const index = findUserIndex(users, creds.email);
  const hashed = await hashPassword(creds.password);

  if (index === -1) {
    users.push({
      id: "admin-novra",
      name: "Admin NOVRA",
      firstName: "Admin",
      lastName: "NOVRA",
      email: creds.email,
      password: hashed,
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
      loyalty: { points: 0, discount: "0%" },
      preferences: { offers: false, orders: true, recommendations: false },
      createdAt: new Date().toISOString(),
    });
    return true;
  }

  const existing = users[index];
  let changed = false;
  if (existing.role !== "admin") {
    existing.role = "admin";
    changed = true;
  }
  const migration = await migratePasswordIfNeeded(creds.password, existing.password);
  if (migration.matched && migration.migrated) {
    existing.password = migration.password;
    changed = true;
  }
  return changed;
}

function buildAdminUser(name: string, email: string, passwordHash: string): StoredUser {
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: `admin-${Date.now()}`,
    name,
    firstName,
    lastName: lastName || undefined,
    email,
    password: passwordHash,
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
    loyalty: { points: 0, discount: "0%" },
    preferences: { offers: false, orders: true, recommendations: false },
    createdAt: new Date().toISOString(),
  };
}

function buildRegisterUser(name: string, email: string, passwordHash: string): StoredUser {
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: `${Date.now()}`,
    name,
    firstName,
    lastName: lastName || undefined,
    email,
    password: passwordHash,
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
    loyalty: { points: SIGNUP_CREDITS, discount: "0%" },
    preferences: { offers: true, orders: true, recommendations: false },
    role: "customer",
    createdAt: new Date().toISOString(),
  };
}

async function authenticateUser(
  users: StoredUser[],
  email: string,
  password: string,
  requireAdmin = false
): Promise<{ user: StoredUser; migrated: boolean } | null> {
  const user = users.find((item) => item.email.toLowerCase() === email);
  if (!user) return null;
  if (requireAdmin && user.role !== "admin") return null;

  const migration = await migratePasswordIfNeeded(password, user.password);
  if (!migration.matched) return null;

  if (migration.migrated) {
    user.password = migration.password;
  }

  return { user, migrated: migration.migrated };
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
        return Response.json({ success: false, message: BANNED_USER_MESSAGE }, { status: 403 });
      }

      const passwordHash = await hashPassword(password);
      const newUser = buildRegisterUser(name, email, passwordHash);
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

    if (action === "login" || action === "admin-login") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password.trim() : "";
      const requireAdmin = action === "admin-login";

      if (!email || !password) {
        return Response.json(
          { success: false, message: "Completează emailul și parola." },
          { status: 400 }
        );
      }

      let users = await readJsonFile<StoredUser[]>(FILE, []);
      if (requireAdmin) {
        const adminEnsured = await ensureDefaultAdmin(users);
        if (adminEnsured) {
          await writeJsonFile(FILE, users);
          users = await readJsonFile<StoredUser[]>(FILE, []);
        }
      }

      const auth = await authenticateUser(users, email, password, requireAdmin);
      if (!auth) {
        return Response.json(
          {
            success: false,
            message: requireAdmin
              ? "Acces refuzat. Doar administratorii pot intra aici."
              : "Date de autentificare incorecte.",
          },
          { status: 401 }
        );
      }

      if (auth.migrated) {
        await writeJsonFile(FILE, users);
      }

      if (auth.user.banned) {
        return Response.json({ success: false, message: BANNED_USER_MESSAGE }, { status: 403 });
      }

      return Response.json({
        success: true,
        message: requireAdmin ? "Autentificare admin reușită!" : "Autentificare reușită!",
        user: stripPassword(auth.user),
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
      const passwordHash = await hashPassword(password);

      if (existingIndex !== -1) {
        const existing = users[existingIndex];
        if (existing.role === "admin") {
          return Response.json(
            { success: false, message: "Există deja un administrator cu acest email." },
            { status: 409 }
          );
        }

        existing.role = "admin";
        existing.password = passwordHash;
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

      const newAdmin = buildAdminUser(name, email, passwordHash);
      users.push(newAdmin);
      await writeJsonFile(FILE, users);

      return Response.json({
        success: true,
        message: "Administrator creat cu succes.",
        user: stripPassword(newAdmin),
      });
    }

    if (action === "change-password") {
      const session = getSessionFromRequest(request);
      if (!session) {
        return Response.json({ success: false, message: "Trebuie să fii autentificat." }, { status: 401 });
      }

      const currentPassword =
        typeof body?.currentPassword === "string" ? body.currentPassword.trim() : "";
      const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

      if (!currentPassword || !newPassword) {
        return Response.json(
          { success: false, message: "Completează toate câmpurile parolei." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return Response.json(
          { success: false, message: "Parola nouă trebuie să aibă cel puțin 6 caractere." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const index = users.findIndex((u) => u.email.toLowerCase() === session.email.toLowerCase());
      if (index === -1) {
        return Response.json({ success: false, message: "Utilizatorul nu a fost găsit." }, { status: 404 });
      }

      const migration = await migratePasswordIfNeeded(currentPassword, users[index].password);
      if (!migration.matched) {
        return Response.json({ success: false, message: "Parola curentă este incorectă." }, { status: 401 });
      }

      if (currentPassword === newPassword) {
        return Response.json(
          { success: false, message: "Parola nouă trebuie să fie diferită de cea curentă." },
          { status: 400 }
        );
      }

      users[index].password = await hashPassword(newPassword);
      await writeJsonFile(FILE, users);

      return Response.json({ success: true, message: "Parola a fost schimbată cu succes." });
    }

    if (action === "forgot-password") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) {
        return Response.json({ success: false, message: "Introdu adresa de email." }, { status: 400 });
      }

      if (!isPasswordResetConfigured()) {
        return Response.json(
          {
            success: false,
            message:
              "Resetarea parolei prin email nu este disponibilă momentan. Contactează suportul la support@novra.ro.",
          },
          { status: 503 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return Response.json({ success: false, message: "Nu am găsit niciun cont cu acest email." }, { status: 404 });
      }

      const token = await createPasswordResetToken(email);
      const resetUrl = `${getStripeCheckoutOrigin()}/contul-meu?reset=${token}`;
      const sent = await sendPasswordResetEmail(email, resetUrl);
      if (!sent) {
        return Response.json(
          { success: false, message: "Nu am putut trimite emailul de resetare. Încearcă din nou." },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: "Un link de resetare a parolei a fost trimis la adresa ta de email.",
      });
    }

    if (action === "reset-password") {
      const token = typeof body?.token === "string" ? body.token.trim() : "";
      const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

      if (!token || !newPassword) {
        return Response.json(
          { success: false, message: "Completează parola nouă." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return Response.json(
          { success: false, message: "Parola trebuie să aibă cel puțin 6 caractere." },
          { status: 400 }
        );
      }

      const email = await consumePasswordResetToken(token);
      if (!email) {
        return Response.json(
          { success: false, message: "Linkul de resetare este invalid sau a expirat." },
          { status: 400 }
        );
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const index = findUserIndex(users, email);
      if (index === -1) {
        return Response.json({ success: false, message: "Utilizatorul nu a fost găsit." }, { status: 404 });
      }

      users[index].password = await hashPassword(newPassword);
      await writeJsonFile(FILE, users);

      return Response.json({ success: true, message: "Parola a fost resetată cu succes." });
    }

    if (action === "check-email") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) {
        return Response.json({ exists: false }, { status: 400 });
      }

      const users = await readJsonFile<StoredUser[]>(FILE, []);
      const exists = findUserIndex(users, email) !== -1;
      return Response.json({ exists, resetAvailable: isPasswordResetConfigured() });
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
