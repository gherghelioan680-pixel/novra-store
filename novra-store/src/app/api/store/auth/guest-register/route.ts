import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { normalizeOrder, type Order } from "@/lib/orders";
import type { User } from "@/lib/auth";
import { hashPassword } from "@/lib/password-server";
import { grantRegistrationCredits } from "@/lib/credits-server";
import { REGISTRATION_CREDITS } from "@/lib/credits-rewards";

export const runtime = "nodejs";

const USERS_FILE = "users.json";
const ORDERS_FILE = "orders.json";

type StoredUser = User & { adminNotes?: string };

function stripPassword(user: StoredUser): Omit<StoredUser, "password"> {
  const { password, ...safe } = user;
  void password;
  return safe;
}

function findUserIndex(users: StoredUser[], email: string): number {
  return users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase());
}

function buildUserFromOrder(order: Order, password: string): StoredUser {
  const name = order.userName.trim() || order.address.name.trim();
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: `${Date.now()}`,
    name,
    firstName,
    lastName: lastName || undefined,
    email: order.userEmail.toLowerCase(),
    password,
    phone: order.address.phone,
    address: order.address.address,
    shippingAddress: {
      fullName: name,
      addressLine: order.address.address,
      city: order.address.city,
      county: order.address.county ?? "",
      postalCode: order.address.postalCode ?? "",
      phone: order.address.phone,
      country: "Romania",
    },
    country: "Romania",
    paymentMethod: "",
    favoriteItems: [],
    orders: [order.id],
    addresses: [],
    paymentMethods: [],
    novraCredits: 0,
    signupBonusClaimed: false,
    registrationCreditsGranted: false,
    profileCreditsGranted: false,
    profileCompleted: false,
    subscribedToNewsletter: false,
    loyalty: {
      points: 0,
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
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const password = typeof body?.password === "string" ? body.password.trim() : "";

    if (!orderId || !password) {
      return Response.json(
        { success: false, message: "Completează parola pentru a crea contul." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: "Parola trebuie să aibă cel puțin 6 caractere." },
        { status: 400 }
      );
    }

    const ordersRaw = await readJsonFile<Partial<Order>[]>(ORDERS_FILE, []);
    const orders = ordersRaw.map(normalizeOrder);
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
      return Response.json(
        { success: false, message: "Comanda nu a fost găsită." },
        { status: 404 }
      );
    }

    const order = orders[orderIndex];
    const guestOrder = order.isGuest || order.userId.startsWith("guest-");

    if (!guestOrder) {
      return Response.json(
        { success: false, message: "Această comandă este deja asociată unui cont." },
        { status: 409 }
      );
    }

    const users = await readJsonFile<StoredUser[]>(USERS_FILE, []);
    if (findUserIndex(users, order.userEmail) !== -1) {
      return Response.json(
        { success: false, message: "Există deja un cont cu acest email." },
        { status: 409 }
      );
    }

    const newUser = buildUserFromOrder(order, password);
    newUser.password = await hashPassword(password);
    users.push(newUser);

    orders[orderIndex] = {
      ...order,
      userId: newUser.id,
      isGuest: false,
      updatedAt: new Date().toISOString(),
    };

    await writeJsonFile(USERS_FILE, users);
    await writeJsonFile(ORDERS_FILE, orders);

    const signupReward = await grantRegistrationCredits(newUser.email);
    const creditedUser =
      signupReward.ok && signupReward.user ? signupReward.user : newUser;

    return Response.json({
      success: true,
      message: `Cont creat cu succes. Datele comenzii au fost salvate în contul tău. Ai primit ${REGISTRATION_CREDITS} NovraCredits.`,
      user: stripPassword(creditedUser as StoredUser),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "StorageUnavailableError") {
      return Response.json(
        {
          success: false,
          message: "Serverul nu poate salva contul momentan. Încearcă din nou.",
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
