import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { success, error } from "../utils/response.utils";

/**
 * Get users list controller
 */
export async function getUsersList(req: Request, res: Response) {
    try {
        const users = await userService.getUsersList();
        return success(res, users);
    } catch (err) {
        console.error("Get users error:", err);
        return error(res, "Error fetching users");
    }
}
