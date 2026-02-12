import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { success, unauthorized } from "../utils/response.utils";
import { HTTP_STATUS } from "../constants";

/**
 * Login controller
 */
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        const result = await authService.login({ email, password });

        if (!result) {
            return unauthorized(res, "Invalid email or password");
        }

        return success(res, result);
    } catch (error) {
        console.error("Login error:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: "Internal server error"
        });
    }
}
