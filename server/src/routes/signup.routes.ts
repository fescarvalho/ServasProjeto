import { Router } from "express";
import * as signupController from "../controllers/signup.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/toggle-signup", signupController.toggleSignup);
router.patch("/:id/role", signupController.changeRole);
router.patch("/:id/toggle-presence", signupController.togglePresence);
router.patch("/:id/promote", signupController.promoteSignup);
router.delete("/:id", signupController.removeSignup);
router.post("/swap", signupController.swapSignup);

export default router;
