/* NOVRA Store — service worker pentru notificări push */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "NOVRA", body: "Ai o nouă ofertă!", link: "/", icon: "/logo.png" };

  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/logo.png",
    badge: "/logo.png",
    data: { url: payload.link || "/" },
    tag: "novra-offer",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
