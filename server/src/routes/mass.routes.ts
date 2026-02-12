import { Router } from "express";
import * as massController from "../controllers/mass.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, massController.getMasses);
router.post("/", massController.createMass);
router.put("/:id", massController.updateMass);
router.delete("/:id", massController.deleteMass);
router.patch("/:id", authMiddleware, massController.patchMass);
router.patch("/:id/toggle-open", massController.toggleOpen);

export default router;
