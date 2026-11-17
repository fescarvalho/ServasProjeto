import { Router } from "express";
import * as signupController from "../controllers/signup.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/toggle-signup", signupController.toggleSignup);
router.post("/:id/checkin", signupController.selfCheckIn);

// Rotas administrativas de gerenciamento de escala
router.patch("/:id/role", adminMiddleware, signupController.changeRole);
router.patch("/:id/toggle-presence", adminMiddleware, signupController.togglePresence);
router.patch("/:id/promote", adminMiddleware, signupController.promoteSignup);
router.delete("/:id", adminMiddleware, signupController.removeSignup);
router.post("/swap", adminMiddleware, signupController.swapSignup);

export default router;
