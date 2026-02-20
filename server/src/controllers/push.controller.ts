import { Request, Response } from "express";
import * as pushService from "../services/push.service";
import { success, error } from "../utils/response.utils";

/**
 * GET /push/vapid-public-key — returns public VAPID key to frontend
 */
export async function getVapidPublicKey(req: Request, res: Response) {
    return success(res, { publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}

/**
 * POST /push/subscribe — save a push subscription
 * Body: { userId, subscription: { endpoint, keys: { p256dh, auth } } }
 */
export async function subscribe(req: Request, res: Response) {
    try {
        const { userId, subscription } = req.body;
        await pushService.saveSubscription(userId, subscription);
        return success(res, { message: "Subscription saved." });
    } catch (err) {
        console.error("Push subscribe error:", err);
        return error(res, "Erro ao salvar inscrição push.");
    }
}

/**
 * DELETE /push/unsubscribe — remove a push subscription
 * Body: { endpoint }
 */
export async function unsubscribe(req: Request, res: Response) {
    try {
        const { endpoint } = req.body;
        await pushService.removeSubscription(endpoint);
        return success(res, { message: "Subscription removed." });
    } catch (err) {
        console.error("Push unsubscribe error:", err);
        return error(res, "Erro ao remover inscrição push.");
    }
}

/**
 * POST /push/send-reminders — trigger reminder notifications for tomorrow's masses
 */
export async function sendReminders(req: Request, res: Response) {
    try {
        const result = await pushService.sendReminders();
        return success(res, result);
    } catch (err) {
        console.error("Send reminders error:", err);
        return error(res, "Erro ao enviar lembretes.");
    }
}
