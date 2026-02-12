import { Router } from "express";
import * as signupController from "../controllers/signup.controller";

const router = Router();

router.post("/toggle-signup", signupController.toggleSignup);
router.patch("/:id/role", signupController.changeRole);
router.patch("/:id/toggle-presence", signupController.togglePresence);
router.patch("/:id/promote", signupController.promoteSignup);
router.delete("/:id", signupController.removeSignup);
router.post("/swap", signupController.swapSignup);

export default router;
