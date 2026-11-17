import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";

/**
 * Global error handling middleware
 */
export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error("Error:", err);

    const status = (err as any).status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const isDev = process.env.NODE_ENV === "development";
    const message =
        !isDev && status >= 500
            ? "Erro interno no servidor"
            : err.message || "Internal server error";

    res.status(status).json({
        error: message,
        ...(isDev && { stack: err.stack }),
    });
}

/**
 * 404 Not Found middleware
 */
export function notFoundMiddleware(req: Request, res: Response) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        error: "Route not found",
    });
}
