import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Rotas pÃºblicas/autenticadas para listagem e metadados
router.get("/list", authMiddleware, userController.getUsersList);
router.get("/metadata", authMiddleware, userController.getUserMeta);

// Rotas autenticadas para indisponibilidade programada do prÃ³prio servo(a)
router.get("/unavailability", authMiddleware, userController.getMyUnavailabilities);
router.post("/unavailability", authMiddleware, userController.addUnavailability);
router.delete("/unavailability/:date", authMiddleware, userController.removeUnavailability);

// Rotas protegidas â€” apenas Admin
router.get("/list-full", authMiddleware, adminMiddleware, userController.getUsersListFull);
router.post("/", authMiddleware, adminMiddleware, userController.createUser);
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);
router.put("/:id/suspension", authMiddleware, adminMiddleware, userController.setSuspension);
router.delete("/:id/suspension", authMiddleware, adminMiddleware, userController.removeSuspension);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

export default router;

