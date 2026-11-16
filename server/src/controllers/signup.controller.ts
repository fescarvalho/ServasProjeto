import { Request, Response } from "express";
import * as signupService from "../services/signup.service";
import { success, error } from "../utils/response.utils";
import { prisma } from "../config/database";

/**
 * Toggle signup (join or leave)
 */
export async function toggleSignup(req: Request, res: Response) {
    try {
        const { userId, massId } = req.body;
        
        // Verifica papel do requerente
        let isAdmin = false;
        if (req.userId) {
            const reqUser = await prisma.user.findUnique({ where: { id: req.userId } });
            isAdmin = reqUser?.role === "ADMIN";
        }

        // Validação de segurança: apenas ADMIN pode inscrever/desinscrever terceiros
        if (req.userId !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado." });
        }

        const result = await signupService.toggleSignup(userId, massId, isAdmin);
        return success(res, result);
    } catch (err: any) {
        console.error("Toggle signup error:", err);
        return error(res, err.message || "Error processing signup");
    }
}

/**
 * Change role of a signup
 */
export async function changeRole(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const signup = await signupService.changeRole(String(id), role);
        return success(res, signup);
    } catch (err) {
        console.error("Change role error:", err);
        return error(res, "Error changing role");
    }
}

/**
 * Toggle presence
 */
export async function togglePresence(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const signup = await signupService.togglePresence(String(id));
        return success(res, signup);
    } catch (err) {
        console.error("Toggle presence error:", err);
        return error(res, "Error confirming presence");
    }
}

/**
 * Self check-in by the server on the day/window of the mass
 */
export async function selfCheckIn(req: Request, res: Response) {
    try {
        const { id } = req.params;
        let isAdmin = false;
        if (req.userId) {
            const reqUser = await prisma.user.findUnique({ where: { id: req.userId } });
            isAdmin = reqUser?.role === "ADMIN";
        }

        const signup = await signupService.selfCheckIn(String(id), String(req.userId), isAdmin);
        return success(res, signup);
    } catch (err: any) {
        console.error("Self check-in error:", err);
        return error(res, err.message || "Erro ao realizar check-in de presença.");
    }
}

/**
 * Promote signup from reserve to confirmed
 */
export async function promoteSignup(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await signupService.promoteSignup(String(id));
        return success(res, { message: "Signup promoted successfully!" });
    } catch (err) {
        console.error("Promote signup error:", err);
        return error(res, "Error promoting signup");
    }
}

/**
 * Remove a signup
 */
export async function removeSignup(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = await signupService.removeSignup(String(id));
        return success(res, result);
    } catch (err) {
        console.error("Remove signup error:", err);
        return error(res, "Error removing signup");
    }
}

/**
 * Swap signup (replace user)
 */
export async function swapSignup(req: Request, res: Response) {
    try {
        const { oldSignupId, newUserId } = req.body;
        const result = await signupService.swapSignup(oldSignupId, newUserId);
        return success(res, result);
    } catch (err) {
        console.error("Swap signup error:", err);
        return error(res, "Error swapping signup");
    }
}
