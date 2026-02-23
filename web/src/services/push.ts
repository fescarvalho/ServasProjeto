import { api } from "./api";

// This is the VAPID Public Key created by generating keys in the backend
// It needs to be in the frontend .env file as VITE_VAPID_PUBLIC_KEY
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPushNotifications(token: string) {
    console.log("--> Starting Push Subscription process!");

    if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker isn't supported on this browser.");
        return;
    }
    if (!("PushManager" in window)) {
        console.warn("Push API isn't supported on this browser.");
        return;
    }

    console.log("--> Found VAPID Key:", publicVapidKey.substring(0, 10) + "...");

    if (!publicVapidKey) {
        console.warn("VAPID public key is missing.");
        return;
    }

    const permission = await Notification.requestPermission();
    console.log("--> Notification Permission Status:", permission);

    if (permission !== "granted") {
        console.warn("Permission not granted for Notification");
        return;
    }

    try {
        console.log("--> Awaiting Service Worker Ready...");
        const registration = await navigator.serviceWorker.ready;
        console.log("--> Service Worker is ready! Registration scope:", registration.scope);

        console.log("--> Calling registration.pushManager.subscribe...");
        // Always subscribe to ensure server has the most up-to-date subscription details
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        console.log("--> Subscription created! Sending to API:", subscription);

        // Send the subscription to the backend with explicit token
        await api.post("/push/subscribe", { subscription }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("--> Push notification successfully saved on the server!");
    } catch (error) {
        console.error("--> FATAL: Failed to subscribe the user to push notifications: ", error);
    }
}
