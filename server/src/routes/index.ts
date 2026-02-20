import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import noticeRoutes from "./notice.routes";
import massRoutes from "./mass.routes";
import signupRoutes from "./signup.routes";
import swapRequestRoutes from "./swap-request.routes";

const router = Router();

// Mount routes
router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/notices", noticeRoutes);
router.use("/masses", massRoutes);
router.use("/signup", signupRoutes);
router.use("/swap-requests", swapRequestRoutes);

export default router;
