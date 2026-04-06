import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Rota pública (usada para selects de inscrição)
router.get("/list", userController.getUsersList);

// Rotas protegidas — apenas Admin
router.get("/list-full", authMiddleware, adminMiddleware, userController.getUsersListFull);
router.post("/", authMiddleware, adminMiddleware, userController.createUser);
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

export default router;
