import type { User } from "@/lib/auth";

export const REGISTRATION_CREDITS = 2;
export const PROFILE_COMPLETION_CREDITS = 8;

export function isProfileComplete(user: Pick<User, "firstName" | "lastName" | "dateOfBirth" | "phone" | "country">): boolean {
  return Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.dateOfBirth?.trim() &&
      user.phone?.trim() &&
      user.country?.trim()
  );
}
