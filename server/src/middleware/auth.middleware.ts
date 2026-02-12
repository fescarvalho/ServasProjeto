import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { unauthorized } from "../utils/response.utils";

/**
 * Authentication middleware
 * Validates JWT token and adds userId to request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // Validate authorization header
    if (!authHeader || typeof authHeader !== "string") {
        return unauthorized(res, "Token not provided or invalid format");
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
        return unauthorized(res, "Token error");
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return unauthorized(res, "Malformed token");
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
        req.userId = decoded.id;
        return next();
    } catch (err) {
        return unauthorized(res, "Invalid token");
    }
}
