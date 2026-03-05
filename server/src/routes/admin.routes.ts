import { Router } from "express";
import multer from "multer";
import { prisma } from "../config/database";
import { authMiddleware } from "../middleware/auth.middleware";
import { success, unauthorized } from "../utils/response.utils";
import { parseScheduleImage } from "../services/ai.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /admin/upload-schedule — Processa imagem da agenda com IA
 */
router.post("/upload-schedule", authMiddleware, upload.single("schedule"), async (req, res) => {
    try {
        // Verificar se o usuário autenticado é ADMIN
        const requestingUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });

        if (!requestingUser || requestingUser.role !== "ADMIN") {
            return unauthorized(res, "Acesso restrito ao Admin");
        }

        if (!req.file) {
            return res.status(400).json({ error: "Nenhuma imagem enviada." });
        }

        const extractedMasses = await parseScheduleImage(req.file.buffer, req.file.mimetype);

        return success(res, extractedMasses);
    } catch (error: any) {
        console.error("Error processing schedule image:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});

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
