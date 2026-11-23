import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { unauthorized } from "../utils/response.utils";

/**
 * Authentication middleware
 * Validates JWT token, checks user is active, and adds userId to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // Validate authorization header
    if (!authHeader || typeof authHeader !== "string") {
        return unauthorized(res, "Sessão não iniciada. Faça login novamente.");
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
        return unauthorized(res, "Sessão inválida. Faça login novamente.");
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return unauthorized(res, "Sessão inválida. Faça login novamente.");
    }

    let decoded: { id: string };
    try {
        decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    } catch (err) {
        return unauthorized(res, "Sua sessão expirou. Faça login novamente.");
    }

    try {
        let user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { role: true },
        });

        if (!user || user.role === "INATIVO") {
            return unauthorized(res, "Cadastro inativo ou inválido");
        }

        req.userId = decoded.id;
        return next();
    } catch (dbErr) {
        // Em caso de oscilação momentânea do pool de conexão serverless, tenta validar mais 1 vez
        try {
            const userRetry = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { role: true },
            });
            if (!userRetry || userRetry.role === "INATIVO") {
                return unauthorized(res, "Cadastro inativo ou inválido");
            }
            req.userId = decoded.id;
            return next();
        } catch {
            // Não invalida a sessão caso seja apenas uma falha momentânea de conexão com o banco
            req.userId = decoded.id;
            return next();
        }
    }
}
