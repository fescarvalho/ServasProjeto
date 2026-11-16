import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Rotas públicas/autenticadas para listagem e metadados
router.get("/list", userController.getUsersList);
router.get("/metadata", userController.getUserMeta);

// Rotas autenticadas para indisponibilidade programada do próprio servo(a)
router.post("/unavailability", authMiddleware, userController.addUnavailability);
router.delete("/unavailability/:date", authMiddleware, userController.removeUnavailability);

// Rotas protegidas — apenas Admin
router.get("/list-full", authMiddleware, adminMiddleware, userController.getUsersListFull);
router.post("/", authMiddleware, adminMiddleware, userController.createUser);
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

export default router;
