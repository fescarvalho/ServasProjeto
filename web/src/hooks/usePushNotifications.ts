import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/api/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return view;
}

interface UsePushNotificationsReturn {
    isSubscribed: boolean;
    isSupported: boolean;
    permission: NotificationPermission;
    subscribe: (userId: string) => Promise<void>;
    unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

    useEffect(() => {
        if (!isSupported) return;
        setPermission(Notification.permission);
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
        });
    }, [isSupported]);

    const subscribe = useCallback(async (userId: string) => {
        if (!isSupported) throw new Error("Push não suportado neste browser.");

        // Request permission with timeout (iOS Safari prevents this and hangs if not installed as PWA properly)
        const permPromise = Notification.requestPermission();
        const permTimeout = new Promise<NotificationPermission>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: O navegador bloqueou ou não respondeu ao pedido de permissão. Tente verificar as configurações do celular.")), 8000)
        );
        const perm = await Promise.race([permPromise, permTimeout]);
        setPermission(perm);
        if (perm !== "granted") throw new Error("Permissão de notificação negada.");

        // Get VAPID public key (use timestamp to bypass browser cache)
        const { data } = await apiClient.get<{ publicKey: string }>(`/push/vapid-public-key?t=${Date.now()}`);
        if (!data.publicKey) throw new Error("VAPID public key não configurada no servidor.");

        // Subscribe via PushManager
        // Força registro explicito + timeout par não travar silenciosamente
        const regPromise = navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready);
        const timeoutPromise = new Promise<ServiceWorkerRegistration>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: Service Worker não iniciou após 10s. Verifique se o app está instalado e operante.")), 10000)
        );
        const reg = await Promise.race([regPromise, timeoutPromise]);
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });

        // Send subscription to backend
        await apiClient.post("/push/subscribe", { userId, subscription });
        setIsSubscribed(true);
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await apiClient.delete("/push/unsubscribe", { data: { endpoint: sub.endpoint } });
            await sub.unsubscribe();
        }
        setIsSubscribed(false);
    }, []);

    return { isSubscribed, isSupported, permission, subscribe, unsubscribe };
}
