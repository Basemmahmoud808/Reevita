self.addEventListener("push", (event) => {
  if (!event.data) return;

  let message = {};
  try {
    message = event.data.json();
  } catch {
    message = { title: "تنبيه جديد من ReeVita", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(message.title || "تنبيه جديد من ReeVita", {
      body: message.body || "يوجد تحديث جديد في لوحة الإدارة.",
      icon: "/images/brand/icon-192.png",
      badge: "/images/brand/icon-192.png",
      tag: message.tag || "reevita-admin-notification",
      data: { url: message.url || "/admin" },
      dir: "rtl",
      lang: "ar",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin", self.location.origin).toString();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) return existing.navigate(target).then(() => existing.focus());
      return self.clients.openWindow(target);
    }),
  );
});
