import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function getUnreadNotifications(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autorizado" });
        }

        // Lógica de Notificações In-App:
        // Busca Missas que estão publicadas, no futuro, abertas para inscrição,
        // mas que o usuário AINDA não se inscreveu.
        const now = new Date();

        const pendingMasses = await prisma.mass.findMany({
            where: {
                published: true,
                open: true,
                date: { gt: now },
                signups: {
                    none: { userId } // Usuário ainda não tem inscrição nesta missa
                }
            },
            select: {
                id: true,
                name: true,
                date: true,
            },
            orderBy: { date: "asc" }
        });

        res.json({
            count: pendingMasses.length,
            masses: pendingMasses
        });
    } catch (err) {
        console.error("[Notification] Erro ao buscar notificações:", err);
        res.status(500).json({ message: "Erro ao buscar notificações." });
    }
}
