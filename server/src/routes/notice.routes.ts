import { Router } from "express";
import * as noticeController from "../controllers/notice.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Cron da Vercel (sem JWT)
router.get("/cron/monthly-champion", noticeController.postMonthlyChampion);

router.get("/", authMiddleware, noticeController.getNotices);
router.post("/", authMiddleware, adminMiddleware, noticeController.createNotice);
router.delete("/:id", authMiddleware, adminMiddleware, noticeController.deleteNotice);

export default router;
