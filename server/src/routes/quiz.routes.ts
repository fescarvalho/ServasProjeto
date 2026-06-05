import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAvailableQuizzes, submitQuizResult, getQuizResultForResponder } from "../controllers/quiz.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getAvailableQuizzes);
router.get("/:id/result", getQuizResultForResponder);
router.post("/:id/submit", submitQuizResult);

export default router;
