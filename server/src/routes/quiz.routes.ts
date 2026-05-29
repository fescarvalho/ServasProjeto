import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAvailableQuizzes, submitQuizResult } from "../controllers/quiz.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getAvailableQuizzes);
router.post("/:id/submit", submitQuizResult);

export default router;
