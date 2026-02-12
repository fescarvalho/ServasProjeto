import { Request, Response } from "express";
import * as signupService from "../services/signup.service";
import { success, error } from "../utils/response.utils";

/**
 * Toggle signup (join or leave)
 */
export async function toggleSignup(req: Request, res: Response) {
    try {
        const { userId, massId } = req.body;
        const result = await signupService.toggleSignup(userId, massId);
        return success(res, result);
    } catch (err) {
        console.error("Toggle signup error:", err);
        return error(res, "Error processing signup");
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
