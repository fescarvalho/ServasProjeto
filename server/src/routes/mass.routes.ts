import { Router } from "express";
import * as massController from "../controllers/mass.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Leitura: qualquer usuário logado
router.get("/", authMiddleware, massController.getMasses);
router.get("/:id/photo", authMiddleware, massController.getMassPhoto);

// Upload de foto da equipe no dia da missa: servo(a) escalado(a) na missa ou ADMIN
router.post("/:id/photo", authMiddleware, massController.uploadMassPhoto);

// Criar / editar / apagar / publicar / abrir / gerir foto e presença: apenas ADMIN
router.delete("/:id/photo", authMiddleware, adminMiddleware, massController.deleteMassPhoto);
router.post("/:id/confirm-all-presence", authMiddleware, adminMiddleware, massController.confirmAllPresence);
router.post("/", authMiddleware, adminMiddleware, massController.createMass);
router.put("/:id", authMiddleware, adminMiddleware, massController.updateMass);
router.delete("/:id", authMiddleware, adminMiddleware, massController.deleteMass);
router.patch("/:id", authMiddleware, adminMiddleware, massController.patchMass);
router.patch("/:id/toggle-open", authMiddleware, adminMiddleware, massController.toggleOpen);

export default router;
