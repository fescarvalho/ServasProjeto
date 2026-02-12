import { Response } from "express";
import { HTTP_STATUS } from "../constants";

/**
 * Send success response
 */
export function success<T>(res: Response, data: T, status: number = HTTP_STATUS.OK) {
    return res.status(status).json(data);
}

/**
 * Send error response
 */
export function error(
    res: Response,
    message: string,
    status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
) {
    return res.status(status).json({ error: message });
}

/**
 * Send not found response
 */
export function notFound(res: Response, resource: string = "Resource") {
    return error(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
}

/**
 * Send unauthorized response
 */
export function unauthorized(res: Response, message: string = "Unauthorized") {
    return error(res, message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Send bad request response
 */
export function badRequest(res: Response, message: string = "Bad request") {
    return error(res, message, HTTP_STATUS.BAD_REQUEST);
}
