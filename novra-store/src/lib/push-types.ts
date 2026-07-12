export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  lastSeenAt: string;
};

export type PushNotificationRecord = {
  id: string;
  title: string;
  body: string;
  link: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: string;
  sentAt?: string;
  recipientCount?: number;
  successCount?: number;
  failureCount?: number;
  createdAt: string;
};

export const PUSH_SUBSCRIPTIONS_FILE = "push-subscriptions.json";
export const PUSH_NOTIFICATIONS_FILE = "push-notifications.json";
