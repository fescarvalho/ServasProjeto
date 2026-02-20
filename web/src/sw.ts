/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Required by injectManifest — Workbox injects the precache manifest here
precacheAndRoute(self.__WB_MANIFEST);

// ── PUSH EVENT ──────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload: { title: string; body: string; url?: string };
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "Servas do Altar", body: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: { url: payload.url || "/" },
        })
    );
});

// ── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const existing = clients.find((c) => c.url.includes(self.location.origin));
                if (existing) {
                    existing.focus();
                    existing.navigate(url);
                } else {
                    self.clients.openWindow(url);
                }
            })
    );
});
