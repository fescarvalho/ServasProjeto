import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import noticeRoutes from "./notice.routes";
import massRoutes from "./mass.routes";
import signupRoutes from "./signup.routes";
import swapRequestRoutes from "./swap-request.routes";
import notificationRoutes from "./notification.routes";
import pushRoutes from "./push.routes";
import liturgyRoutes from "./liturgy.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Mount routes
router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/notices", noticeRoutes);
router.use("/masses", massRoutes);
router.use("/signup", signupRoutes);
router.use("/swap-requests", swapRequestRoutes);
router.use("/notifications", notificationRoutes);
router.use("/push", pushRoutes);
router.use("/liturgy", liturgyRoutes);
router.use("/admin", adminRoutes);

export default router;

