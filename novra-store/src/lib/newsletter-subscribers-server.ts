import "server-only";

import { readJsonFile } from "@/lib/server-data";
import type { NewsletterSubscriber } from "@/lib/newsletter";

const SUBSCRIBERS_FILE = "newsletter.json";
const USERS_FILE = "users.json";

type StoredUser = {
  email: string;
  name?: string;
  role?: string;
  subscribedToNewsletter?: boolean;
};

/** Newsletter list plus account users marked subscribedToNewsletter (excludes admins). */
export async function loadNewsletterSubscriberDirectory(): Promise<Map<string, string | undefined>> {
  const [subscribers, users] = await Promise.all([
    readJsonFile<NewsletterSubscriber[]>(SUBSCRIBERS_FILE, []),
    readJsonFile<StoredUser[]>(USERS_FILE, []),
  ]);

  const directory = new Map<string, string | undefined>();

  for (const sub of subscribers) {
    const email = sub.email?.trim().toLowerCase();
    if (!email) continue;
    directory.set(email, sub.name?.trim() || undefined);
  }

  for (const user of users) {
    if (user.role === "admin") continue;
    if (user.subscribedToNewsletter !== true) continue;
    const email = user.email?.trim().toLowerCase();
    if (!email || directory.has(email)) continue;
    directory.set(email, user.name?.trim() || undefined);
  }

  return directory;
}

export async function loadNewsletterRecipientEmails(): Promise<string[]> {
  const directory = await loadNewsletterSubscriberDirectory();
  return [...directory.keys()];
}
