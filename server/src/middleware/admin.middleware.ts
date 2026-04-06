import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { unauthorized } from "../utils/response.utils";

/**
 * Middleware que verifica se o usuário autenticado é ADMIN.
 * Deve ser usado APÓS o authMiddleware.
 */
export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return unauthorized(res, "Acesso restrito ao Admin");
        }

        return next();
    } catch (err) {
        console.error("Admin middleware error:", err);
        return unauthorized(res, "Erro na verificação de permissão");
    }
}
