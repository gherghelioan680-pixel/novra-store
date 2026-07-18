import { addNewsletterSubscriber } from "./newsletter";
import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import { getInviteRef } from "./referral-attribution";
import type { AppLocale } from "@/i18n/routing";

export type ShippingAddress = {
  fullName: string;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
  phone: string;
  country: string;
};

export type UserRole = "admin" | "customer";

export type SessionData = {
  userId: string;
  email: string;
  role: UserRole;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  phone?: string;
  address?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  favoriteItems?: string[];
  orders?: string[];
  addresses?: string[];
  paymentMethods?: string[];
  novraCredits?: number;
  profileCompleted?: boolean;
  signupBonusClaimed?: boolean;
  subscribedToNewsletter?: boolean;
  /** Cod unic program recomandă prieten. */
  friendReferralCode?: string;
  /** Codul cu care utilizatorul a fost invitat. */
  referredByCode?: string;
  loyalty?: {
    points: number;
    discount: string;
  };
  preferences?: {
    offers: boolean;
    orders: boolean;
    recommendations: boolean;
  };
  createdAt: string;
  /** Cont blocat de admin — nu poate autentifica sau plasa comenzi. */
  banned?: boolean;
  /** Last browsing locale synced from the public site. */
  preferredLocale?: AppLocale;
};

export type SafeUser = Omit<User, "password"> & { adminNotes?: string };

const USERS_KEY = "novra-users";
const CURRENT_USER_KEY = "novra-current-user";
const SESSION_KEY = "novra-session";

const SIGNUP_CREDITS = 50;
const PROFILE_COMPLETE_CREDITS = 100;

function isBrowser() {
  return typeof window !== "undefined";
}

const STORAGE_UNAVAILABLE_MSG =
  "Browserul blochează stocarea locală (mod privat sau setări de confidențialitate). Dezactivează modul privat sau permite cookie-urile pentru acest site.";

function canUseLocalStorage(): boolean {
  if (!isBrowser()) return false;
  try {
    const probe = "__novra_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function storageSet(key: string, value: string): { ok: true } | { ok: false; message: string } {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch {
    return { ok: false, message: STORAGE_UNAVAILABLE_MSG };
  }
}

function storageRemove(key: string): { ok: true } | { ok: false; message: string } {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }
  try {
    window.localStorage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, message: STORAGE_UNAVAILABLE_MSG };
  }
}

export function getUserRole(user: User | null | undefined): UserRole {
  return user?.role === "admin" ? "admin" : "customer";
}

export function isAdmin(user?: User | null): boolean {
  const target = user ?? getCurrentUser();
  return getUserRole(target) === "admin";
}

function syncSession(user: User | null) {
  if (!isBrowser()) return;
  if (user) {
    const session: SessionData = {
      userId: user.id,
      email: user.email,
      role: getUserRole(user),
    };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      syncSessionCookie(session);
    } catch {
      /* ignore */
    }
  } else {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      syncSessionCookie(null);
    } catch {
      /* ignore */
    }
  }
}

function syncSessionCookie(session: SessionData | null) {
  if (!isBrowser()) return;

  const maxAge = 60 * 60 * 24 * 30;
  if (session) {
    const value = encodeURIComponent(JSON.stringify(session));
    document.cookie = `novra-session=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = "novra-session=; path=/; max-age=0; SameSite=Lax";
  }
}

export function getSession(): SessionData | null {
  if (!isBrowser()) return null;

  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as SessionData) : null;
  } catch {
    return null;
  }
}

export function ensureAdminUser(): void {
  /* Admin accounts are provisioned server-side via ADMIN_EMAIL / ADMIN_PASSWORD env vars. */
}

export function requireAdmin(): User | null {
  const user = getCurrentUser();
  if (!user || !isAdmin(user)) return null;
  return user;
}

export function getNovraCredits(user: User | null | undefined): number {
  if (!user) return 0;
  if (typeof user.novraCredits === "number") return user.novraCredits;
  return user.loyalty?.points ?? 0;
}

export function getDisplayFirstName(user: User | null | undefined): string {
  if (!user) return "";
  if (user.firstName?.trim()) return user.firstName.trim();
  const parts = user.name.trim().split(/\s+/);
  return parts[0] || "";
}

export function isProfileComplete(user: User): boolean {
  return Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.dateOfBirth?.trim() &&
      user.phone?.trim() &&
      user.country?.trim()
  );
}

function applyProfileCompletionBonus(user: User): User {
  if (user.profileCompleted || !isProfileComplete(user)) {
    return user;
  }

  return {
    ...user,
    profileCompleted: true,
    novraCredits: getNovraCredits(user) + PROFILE_COMPLETE_CREDITS,
  };
}

export function getStoredUsers(): User[] {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    return stored ? (JSON.parse(stored) as User[]) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): { ok: true } | { ok: false; message: string } {
  return storageSet(USERS_KEY, JSON.stringify(users));
}

function upsertLocalUser(user: User): { ok: true } | { ok: false; message: string } {
  const users = getStoredUsers();
  const index = users.findIndex(
    (item) => item.id === user.id || item.email.toLowerCase() === user.email.toLowerCase()
  );

  if (index === -1) {
    users.push(user);
  } else {
    users[index] = { ...users[index], ...user, password: user.password };
  }

  return saveUsers(users);
}

function mergeServerUserWithPassword(
  serverUser: Omit<User, "password">,
  password: string
): User {
  return { ...serverUser, password };
}

export function getCurrentUser(): User | null {
  if (!isBrowser()) return null;

  try {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);
    const user = stored ? (JSON.parse(stored) as User) : null;
    if (user) syncSession(user);
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): { ok: true } | { ok: false; message: string } {
  if (user) {
    const result = storageSet(CURRENT_USER_KEY, JSON.stringify(user));
    if (result.ok) syncSession(user);
    return result;
  }
  const result = storageRemove(CURRENT_USER_KEY);
  if (result.ok) syncSession(null);
  return result;
}

export function logoutUser() {
  setCurrentUser(null);
}

export async function registerUser(name: string, email: string, password: string) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    return { success: false, message: "Completează toate câmpurile." };
  }

  if (!canUseLocalStorage()) {
    return { success: false, message: STORAGE_UNAVAILABLE_MSG };
  }

  try {
    const response = await fetch("/api/store/auth", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "register",
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        inviteCode: getInviteRef() ?? undefined,
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      user?: SafeUser;
    };

    if (!response.ok || !data.success || !data.user) {
      return {
        success: false,
        message: data.message ?? "Nu s-a putut crea contul. Încearcă din nou.",
      };
    }

    const newUser = mergeServerUserWithPassword(data.user, trimmedPassword);
    const savedUsers = upsertLocalUser(newUser);
    if (!savedUsers.ok) {
      return { success: false, message: savedUsers.message };
    }

    const savedSession = setCurrentUser(newUser);
    if (!savedSession.ok) {
      return { success: false, message: savedSession.message };
    }

    return {
      success: true,
      message: data.message ?? "Cont creat cu succes! Ai primit 50 NovraCredits.",
      user: newUser,
    };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export async function loginUser(email: string, password: string) {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    return { success: false, message: "Completează emailul și parola." };
  }

  if (!canUseLocalStorage()) {
    return { success: false, message: STORAGE_UNAVAILABLE_MSG };
  }

  try {
    const response = await fetch("/api/store/auth", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "login",
        email: trimmedEmail,
        password: trimmedPassword,
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      user?: SafeUser;
    };

    if (!response.ok || !data.success || !data.user) {
      return {
        success: false,
        message: data.message ?? "Date de autentificare incorecte.",
      };
    }

    const user = mergeServerUserWithPassword(data.user, trimmedPassword);
    const savedUsers = upsertLocalUser(user);
    if (!savedUsers.ok) {
      return { success: false, message: savedUsers.message };
    }

    const savedSession = setCurrentUser(user);
    if (!savedSession.ok) {
      return { success: false, message: savedSession.message };
    }

    return {
      success: true,
      message: data.message ?? "Autentificare reușită!",
      user,
    };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export async function loginAdmin(email: string, password: string) {
  ensureAdminUser();

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    return { success: false, message: "Completează emailul și parola." };
  }

  if (!canUseLocalStorage()) {
    return { success: false, message: STORAGE_UNAVAILABLE_MSG };
  }

  try {
    const response = await fetch("/api/store/auth", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "admin-login",
        email: trimmedEmail,
        password: trimmedPassword,
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      user?: SafeUser;
    };

    if (!response.ok || !data.success || !data.user) {
      return {
        success: false,
        message: data.message ?? "Acces refuzat. Doar administratorii pot intra aici.",
      };
    }

    const user = mergeServerUserWithPassword(data.user, trimmedPassword);
    const savedUsers = upsertLocalUser(user);
    if (!savedUsers.ok) {
      return { success: false, message: savedUsers.message };
    }

    const savedSession = setCurrentUser(user);
    if (!savedSession.ok) {
      return { success: false, message: savedSession.message };
    }

    return {
      success: true,
      message: data.message ?? "Autentificare admin reușită!",
      user,
    };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export async function createAdminUser(name: string, email: string, password: string) {
  if (!requireAdmin()) {
    return { success: false, message: "Acces refuzat." };
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword) {
    return { success: false, message: "Completează numele, emailul și parola." };
  }

  if (trimmedPassword.length < 6) {
    return { success: false, message: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  try {
    const response = await fetch("/api/store/auth", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "create-admin",
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      user?: SafeUser;
    };

    if (!response.ok || !data.success || !data.user) {
      return {
        success: false,
        message: data.message ?? "Nu s-a putut crea administratorul.",
      };
    }

    const newAdmin = mergeServerUserWithPassword(data.user, trimmedPassword);
    upsertLocalUser(newAdmin);
    dispatchStoreUpdate({ scope: "users" });

    return {
      success: true,
      message: data.message ?? "Administrator creat cu succes.",
      user: newAdmin,
    };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export async function loadAdminUsers(): Promise<SafeUser[]> {
  const users = await loadAllUsersFromServer();
  return users.filter((user) => user.role === "admin");
}

export function updateCurrentUserProfile(updates: Partial<User>) {
  if (!isBrowser()) {
    return { success: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { success: false, message: "Nu există un utilizator conectat." };
  }

  const users = getStoredUsers();
  const userIndex = users.findIndex((user) => user.id === currentUser.id);

  if (userIndex === -1) {
    return { success: false, message: "Utilizatorul nu a fost găsit." };
  }

  const mergedUser: User = {
    ...users[userIndex],
    ...updates,
    preferences: {
      offers: updates.preferences?.offers ?? users[userIndex].preferences?.offers ?? true,
      orders: updates.preferences?.orders ?? users[userIndex].preferences?.orders ?? true,
      recommendations:
        updates.preferences?.recommendations ?? users[userIndex].preferences?.recommendations ?? false,
    },
  };

  if (mergedUser.firstName || mergedUser.lastName) {
    mergedUser.name = [mergedUser.firstName, mergedUser.lastName].filter(Boolean).join(" ").trim() || mergedUser.name;
  }

  const updatedUser = applyProfileCompletionBonus(mergedUser);
  const earnedCredits = getNovraCredits(updatedUser) - getNovraCredits(users[userIndex]);

  users[userIndex] = updatedUser;
  const savedUsers = saveUsers(users);
  if (!savedUsers.ok) {
    return { success: false, message: savedUsers.message };
  }

  const savedSession = setCurrentUser(updatedUser);
  if (!savedSession.ok) {
    return { success: false, message: savedSession.message };
  }

  void syncUserToServer(updatedUser);

  const message =
    earnedCredits > 0
      ? `Datele au fost salvate cu succes. Ai primit ${earnedCredits} NovraCredits!`
      : "Datele au fost salvate cu succes.";

  return { success: true, message, user: updatedUser };
}

export async function subscribeUserToNewsletter(email: string) {
  if (!isBrowser()) {
    return { success: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Trebuie să fii autentificat." };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { success: false, message: "Introdu o adresă de email validă." };
  }

  const result = updateCurrentUserProfile({
    subscribedToNewsletter: true,
    preferences: {
      offers: true,
      orders: currentUser.preferences?.orders ?? true,
      recommendations: currentUser.preferences?.recommendations ?? false,
    },
  });

  if (result.success) {
    await addNewsletterSubscriber(trimmedEmail, {
      name: currentUser.name,
      source: "account",
    });
  }

  return result;
}

export function updateShippingAddress(data: Omit<ShippingAddress, "country"> & { country?: string }) {
  const fullName = data.fullName.trim();
  const addressLine = data.addressLine.trim();
  const city = data.city.trim();
  const county = data.county.trim();
  const postalCode = data.postalCode.trim();
  const phone = data.phone.trim();

  if (!fullName || !addressLine || !city || !county || !postalCode || !phone) {
    return { success: false, message: "Completează toate câmpurile adresei de livrare." };
  }

  const shippingAddress: ShippingAddress = {
    fullName,
    addressLine,
    city,
    county,
    postalCode,
    phone,
    country: "Romania",
  };

  return updateCurrentUserProfile({ shippingAddress });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!isBrowser()) {
    return { success: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();

  if (!trimmedCurrent || !trimmedNew) {
    return { success: false, message: "Completează toate câmpurile parolei." };
  }

  if (trimmedNew.length < 6) {
    return { success: false, message: "Parola nouă trebuie să aibă cel puțin 6 caractere." };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Nu există un utilizator conectat." };
  }

  try {
    const response = await fetch("/api/store/auth", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "change-password",
        currentPassword: trimmedCurrent,
        newPassword: trimmedNew,
      }),
    });

    const data = (await response.json()) as { success?: boolean; message?: string };
    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message ?? "Nu s-a putut schimba parola.",
      };
    }

    const users = getStoredUsers();
    const userIndex = users.findIndex((user) => user.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], password: trimmedNew };
      saveUsers(users);
      setCurrentUser({ ...users[userIndex], password: trimmedNew });
    }

    return { success: true, message: data.message ?? "Parola a fost schimbată cu succes.", user: currentUser };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export function deleteAccount() {
  if (!isBrowser()) {
    return { success: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: "Nu există un utilizator conectat." };
  }

  const users = getStoredUsers().filter((user) => user.id !== currentUser.id);
  const savedUsers = saveUsers(users);
  if (!savedUsers.ok) {
    return { success: false, message: savedUsers.message };
  }

  logoutUser();

  return { success: true, message: "Contul a fost șters cu succes." };
}

export async function syncUserToServer(user: User): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch("/api/store/users", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ user }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function syncUserLocale(locale: AppLocale): Promise<void> {
  if (!isBrowser()) return;

  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.preferredLocale === locale) return;

  const updatedUser: User = { ...currentUser, preferredLocale: locale };
  const users = getStoredUsers();
  const index = users.findIndex((user) => user.id === currentUser.id);
  if (index === -1) return;

  users[index] = updatedUser;
  const savedUsers = saveUsers(users);
  if (!savedUsers.ok) return;

  const savedSession = setCurrentUser(updatedUser);
  if (!savedSession.ok) return;

  await syncUserToServer(updatedUser);
}

export async function loadUserFromServer(email: string): Promise<SafeUser | null> {
  const data = await apiFetch<{ user: SafeUser }>(
    `/api/store/users?email=${encodeURIComponent(email)}`
  );
  return data?.user ?? null;
}

export async function loadAllUsersFromServer(): Promise<SafeUser[]> {
  const data = await apiFetch<{ users: SafeUser[] }>("/api/store/users");
  return data?.users ?? [];
}

export async function refreshCurrentUserFromServer(): Promise<User | null> {
  if (!isBrowser()) return null;

  const current = getCurrentUser();
  if (!current) return null;

  const serverUser = await loadUserFromServer(current.email);
  if (!serverUser) return current;

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === current.id);
  const merged: User = {
    ...current,
    ...serverUser,
    password: current.password,
  };

  const currentWithoutPassword = { ...current };
  delete (currentWithoutPassword as Partial<User>).password;
  const mergedWithoutPassword = { ...merged };
  delete (mergedWithoutPassword as Partial<User>).password;
  if (JSON.stringify(currentWithoutPassword) === JSON.stringify(mergedWithoutPassword)) {
    return current;
  }

  if (index !== -1) {
    users[index] = merged;
    saveUsers(users);
  }

  setCurrentUser(merged);
  dispatchStoreUpdate({ scope: "users" });
  return merged;
}

export async function updateUserCreditsAdmin(
  email: string,
  creditsDelta: number,
  reason?: string
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  if (!isBrowser()) return { success: false, message: "Indisponibil." };

  try {
    const response = await fetch("/api/store/users", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ email, creditsDelta, adminNote: reason }),
    });

    if (!response.ok) {
      return { success: false, message: "Actualizarea creditelor a eșuat." };
    }

    const data = (await response.json()) as { user: SafeUser };
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1 && data.user) {
      users[index] = { ...users[index], ...data.user, password: users[index].password };
      saveUsers(users);
    }

    dispatchStoreUpdate({ scope: "users" });
    return { success: true, user: data.user };
  } catch {
    return { success: false, message: "Eroare de rețea." };
  }
}

export async function updateUserProfileAdmin(
  email: string,
  fields: Partial<User>
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  if (!isBrowser()) return { success: false, message: "Indisponibil." };

  try {
    const response = await fetch("/api/store/users", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ email, ...fields }),
    });

    if (!response.ok) {
      return { success: false, message: "Actualizarea profilului a eșuat." };
    }

    const data = (await response.json()) as { user: SafeUser };
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1 && data.user) {
      users[index] = { ...users[index], ...data.user, password: users[index].password };
      saveUsers(users);
    }

    dispatchStoreUpdate({ scope: "users" });
    return { success: true, user: data.user };
  } catch {
    return { success: false, message: "Eroare de rețea." };
  }
}

export async function addAdminNote(
  email: string,
  note: string
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  if (!isBrowser()) return { success: false, message: "Indisponibil." };

  try {
    const response = await fetch("/api/store/users", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ email, adminNote: note }),
    });

    if (!response.ok) {
      return { success: false, message: "Adăugarea notei a eșuat." };
    }

    const data = (await response.json()) as { user: SafeUser };
    dispatchStoreUpdate({ scope: "users" });
    return { success: true, user: data.user };
  } catch {
    return { success: false, message: "Eroare de rețea." };
  }
}

export async function setUserBannedAdmin(
  email: string,
  banned: boolean
): Promise<{ success: boolean; user?: SafeUser; message?: string }> {
  if (!isBrowser()) return { success: false, message: "Indisponibil." };

  try {
    const response = await fetch("/api/store/users", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ email, banned }),
    });

    if (!response.ok) {
      return { success: false, message: banned ? "Blocarea contului a eșuat." : "Deblocarea contului a eșuat." };
    }

    const data = (await response.json()) as { user: SafeUser };
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1 && data.user) {
      users[index] = { ...users[index], ...data.user, password: users[index].password };
      saveUsers(users);
    }

    dispatchStoreUpdate({ scope: "users" });
    return { success: true, user: data.user };
  } catch {
    return { success: false, message: "Eroare de rețea." };
  }
}

export async function deleteUserAdmin(
  email: string
): Promise<{ success: boolean; message?: string }> {
  if (!isBrowser()) return { success: false, message: "Indisponibil." };

  try {
    const response = await fetch("/api/store/users", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      return { success: false, message: data.error ?? "Ștergerea contului a eșuat." };
    }

    const users = getStoredUsers().filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    saveUsers(users);
    dispatchStoreUpdate({ scope: "users" });
    return { success: true };
  } catch {
    return { success: false, message: "Eroare de rețea." };
  }
}

export async function createAccountFromGuestOrder(orderId: string, password: string) {
  const trimmedPassword = password.trim();

  if (!orderId.trim() || !trimmedPassword) {
    return { success: false, message: "Completează parola pentru a crea contul." };
  }

  if (trimmedPassword.length < 6) {
    return { success: false, message: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  if (!canUseLocalStorage()) {
    return { success: false, message: STORAGE_UNAVAILABLE_MSG };
  }

  try {
    const response = await fetch("/api/store/auth/guest-register", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ orderId: orderId.trim(), password: trimmedPassword }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      user?: SafeUser;
    };

    if (!response.ok || !data.success || !data.user) {
      return {
        success: false,
        message: data.message ?? "Nu s-a putut crea contul. Încearcă din nou.",
      };
    }

    const newUser = mergeServerUserWithPassword(data.user, trimmedPassword);
    const savedUsers = upsertLocalUser(newUser);
    if (!savedUsers.ok) {
      return { success: false, message: savedUsers.message };
    }

    const savedSession = setCurrentUser(newUser);
    if (!savedSession.ok) {
      return { success: false, message: savedSession.message };
    }

    return {
      success: true,
      message: data.message ?? "Cont creat cu succes.",
      user: newUser,
    };
  } catch {
    return { success: false, message: "Eroare de rețea. Verifică conexiunea și încearcă din nou." };
  }
}

export function addOrderIdToLocalUser(email: string, orderId: string): void {
  if (!isBrowser()) return;

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) return;

  const orderIds = users[index].orders ?? [];
  if (!orderIds.includes(orderId)) {
    users[index] = { ...users[index], orders: [orderId, ...orderIds] };
    saveUsers(users);

    const current = getCurrentUser();
    if (current?.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser(users[index]);
    }
  }
}
