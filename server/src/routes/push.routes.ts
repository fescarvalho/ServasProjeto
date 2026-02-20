import { Router } from "express";
import * as pushController from "../controllers/push.controller";

const router = Router();

router.get("/vapid-public-key", pushController.getVapidPublicKey);
router.post("/subscribe", pushController.subscribe);
router.delete("/unsubscribe", pushController.unsubscribe);
router.post("/send-reminders", pushController.sendReminders);

export default router;
