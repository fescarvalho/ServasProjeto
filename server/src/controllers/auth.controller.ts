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
    } catch (error: any) {
        if (error?.message === "USER_INATIVO_3_MESES") {
            return res.status(403).json({
                error: "Seu acesso foi bloqueado automaticamente por ficar mais de 3 meses sem escalas. Procure a coordenação para reativar seu cadastro.",
            });
        }
        if (error?.message === "USER_INATIVO") {
            return res.status(403).json({
                error: "Seu cadastro está inativo no momento. Procure a coordenação.",
            });
        }
        console.error("Login error:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: "Internal server error"
        });
    }
}
