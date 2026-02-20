import webpush from "web-push";
import { prisma } from "../config/database";

// Lazy VAPID — only configure when keys are present, won't crash server on startup
function configureWebPush(): boolean {
    const email = process.env.VAPID_EMAIL;
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!email || !pub || !priv) return false;
    try {
        webpush.setVapidDetails(email, pub, priv);
        return true;
    } catch {
        console.warn("[Push] VAPID configuration failed — verifique as chaves no .env");
        return false;
    }
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

/**
 * Save (upsert) a push subscription for a user
 */
export async function saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
    return await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        create: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        },
    });
}

/**
 * Remove a push subscription by endpoint
 */
export async function removeSubscription(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/**
 * Send push notification to all devices of a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    await _sendToSubs(subs, payload);
}

/**
 * Send push notification to ALL subscribed users (broadcast)
 */
export async function sendPushToAll(payload: PushPayload) {
    const subs = await prisma.pushSubscription.findMany();
    await _sendToSubs(subs, payload);
}

/**
 * Send reminder notifications for masses happening tomorrow
 */
export async function sendReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const masses = await prisma.mass.findMany({
        where: { date: { gte: start, lte: end }, published: true },
        include: {
            signups: {
                where: { status: "CONFIRMADO" },
                include: { user: true },
            },
        },
    });

    for (const mass of masses) {
        const time = new Date(mass.date).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
        });
        for (const signup of mass.signups) {
            const role = signup.role || "Auxiliar";
            await sendPushToUser(signup.userId, {
                title: "🌹 Lembrete de Escala",
                body: `Você serve amanhã às ${time} — função: ${role}`,
                url: "/",
            });
        }
    }

    return { massesFound: masses.length };
}

/**
 * Internal helper — send to a list of subscription records
 */
async function _sendToSubs(
    subs: { endpoint: string; p256dh: string; auth: string }[],
    payload: PushPayload
) {
    if (!configureWebPush()) {
        console.warn("[Push] Notificação ignorada — VAPID keys não configuradas.");
        return;
    }
    const results = await Promise.allSettled(
        subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify(payload)
                );
            } catch (err: any) {
                // 410 Gone = subscription expired, remove it
                if (err.statusCode === 410) {
                    await removeSubscription(sub.endpoint);
                }
            }
        })
    );
    return results;
}
