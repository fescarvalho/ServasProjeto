import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Configure Web Push with VAPID keys
// These should ideally be set in environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

// We only set VAPID details if keys are present to prevent crashes on startup if not configured yet
if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        "mailto:contato@servas.com", // Replace with an actual email
        publicVapidKey,
        privateVapidKey
    );
}

export const subscribe = async (req: Request, res: Response): Promise<void> => {
    try {
        const { subscription } = req.body;
        const userId = (req as any).userId; // authMiddleware sets req.userId

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!subscription || !subscription.endpoint) {
            res.status(400).json({ error: "Invalid subscription object" });
            return;
        }

        // Upsert the subscription info for this user
        // In a real app a user might have multiple devices (multiple subscriptions), 
        // but the schema uses endpoint as @unique so we can upsert by endpoint.
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId,
                keys_p256dh: subscription.keys.p256dh,
                keys_auth: subscription.keys.auth,
            },
            create: {
                endpoint: subscription.endpoint,
                keys_p256dh: subscription.keys.p256dh,
                keys_auth: subscription.keys.auth,
                userId,
            },
        });

        res.status(201).json({ message: "Subscription added successfully." });
    } catch (error) {
        console.error("Error saving subscription:", error);
        res.status(500).json({ error: "Failed to save subscription." });
    }
};

export const notifyCron = async (req: Request, res: Response): Promise<void> => {
    try {
        // Optional: Protect cron route with a secret bearer token from Vercel
        const authHeader = req.headers.authorization;
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            res.status(401).json({ error: "Unauthorized cron execution" });
            return;
        }

        if (!publicVapidKey || !privateVapidKey) {
            res.status(500).json({ error: "VAPID keys not configured" });
            return;
        }

        // Get tomorrow's date range
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        // Find all masses for tomorrow
        const massesTomorrow = await prisma.mass.findMany({
            where: {
                date: {
                    gte: startOfTomorrow,
                    lte: endOfTomorrow,
                },
            },
            include: {
                signups: {
                    where: { status: "CONFIRMADO" },
                    include: {
                        user: {
                            include: { pushSubscriptions: true },
                        },
                    },
                },
            },
        });

        let sentCount = 0;

        for (const mass of massesTomorrow) {
            const massTime = new Date(mass.date).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            });

            for (const signup of mass.signups) {
                const userName = signup.user.name ? signup.user.name.split(" ")[0] : "Serva";
                const payload = JSON.stringify({
                    title: "Lembrete de Escala",
                    body: `Olá ${userName}, você serve amanhã às ${massTime}!`,
                });

                for (const sub of signup.user.pushSubscriptions) {
                    if (sub.keys_p256dh && sub.keys_auth) {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys_p256dh,
                                auth: sub.keys_auth,
                            },
                        };

                        try {
                            await webpush.sendNotification(pushSubscription, payload);
                            sentCount++;
                        } catch (err: any) {
                            console.error("Error sending push notification to endpoint", sub.endpoint, err);
                            // If subscription is invalid/expired (410 Gone or 404 Not Found), remove it
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json({ message: `Cron executed. Sent ${sentCount} notifications.` });
    } catch (error) {
        console.error("Error executing cron:", error);
        res.status(500).json({ error: "Cron execution failed." });
    }
};
