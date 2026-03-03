import { Router } from "express";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth.middleware";
import { success, unauthorized } from "../utils/response.utils";

const router = Router();

/**
 * GET /admin/logs — Histórico de logins (últimos 100)
 * Acesso restrito a usuários com role ADMIN
 */
router.get("/logs", authMiddleware, async (req, res) => {
    try {
        // Verificar se o usuário autenticado é ADMIN
        const requestingUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });

        if (!requestingUser || requestingUser.role !== "ADMIN") {
            return unauthorized(res, "Acesso restrito ao Admin");
        }

        const logs = await prisma.loginLog.findMany({
            orderBy: { timestamp: "desc" },
            take: 100,
            include: {
                user: {
                    select: { name: true },
                },
            },
        });

        return success(res, logs);
    } catch (error) {
        console.error("Error fetching login logs:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
