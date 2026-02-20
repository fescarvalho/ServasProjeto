import { Router } from "express";
import { getUnreadNotifications } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/unread", authMiddleware, getUnreadNotifications);

export default router;
