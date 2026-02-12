import { Router } from "express";
import * as noticeController from "../controllers/notice.controller";

const router = Router();

router.get("/", noticeController.getNotices);
router.post("/", noticeController.createNotice);
router.delete("/:id", noticeController.deleteNotice);

export default router;
