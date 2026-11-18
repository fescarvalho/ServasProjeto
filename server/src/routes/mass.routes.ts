import { Router } from "express";
import * as massController from "../controllers/mass.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Leitura: qualquer usuário logado
router.get("/", authMiddleware, massController.getMasses);

// Criar / editar / apagar / publicar / abrir: apenas ADMIN
router.post("/", authMiddleware, adminMiddleware, massController.createMass);
router.put("/:id", authMiddleware, adminMiddleware, massController.updateMass);
router.delete("/:id", authMiddleware, adminMiddleware, massController.deleteMass);
router.patch("/:id", authMiddleware, adminMiddleware, massController.patchMass);
router.patch("/:id/toggle-open", authMiddleware, adminMiddleware, massController.toggleOpen);

export default router;
