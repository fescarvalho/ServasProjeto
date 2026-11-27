import { Router } from "express";
import * as prizeController from "../controllers/prize.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

// Rotas do servo autenticado (verificar se venceu o mês fechado e estourar 1 dos 3 balões)
router.get("/my-pending", authMiddleware, prizeController.getMyPendingPrize);
router.post("/pop", authMiddleware, prizeController.popBalloon);

// Rotas da coordenação (Admin)
router.get("/admin", authMiddleware, adminMiddleware, prizeController.getAdminOverview);
router.put("/admin/config", authMiddleware, adminMiddleware, prizeController.updatePrizesConfig);
router.patch("/admin/claims/:ymKey/delivered", authMiddleware, adminMiddleware, prizeController.toggleClaimDelivered);
router.post("/admin/test/start", authMiddleware, adminMiddleware, prizeController.startTestBalloon);
router.delete("/admin/test", authMiddleware, adminMiddleware, prizeController.clearTestBalloon);
router.post("/admin/grants", authMiddleware, adminMiddleware, prizeController.createManualGrant);
router.delete("/admin/grants/:grantId", authMiddleware, adminMiddleware, prizeController.deleteManualGrant);

export default router;
