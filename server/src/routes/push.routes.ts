import { Router } from "express";
import { subscribe, notifyCron, sendCustomPush } from "../controllers/push.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Endpoint for frontend to subscribe to push notifications
router.post("/subscribe", authMiddleware, subscribe);

// Endpoint for admin to send custom push notifications
router.post("/send-custom", authMiddleware, sendCustomPush);

// Endpoint for Vercel Cron to trigger notifications
// We don't use standard authMiddleware here because Vercel Cron doesn't have a user JWT token
router.get("/cron/notify", notifyCron);

export default router;
