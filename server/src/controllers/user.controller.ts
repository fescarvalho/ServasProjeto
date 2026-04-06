import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { success, error, badRequest } from "../utils/response.utils";
import { HTTP_STATUS } from "../constants";

/**
 * Get users list (id + name only)
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

/**
 * Get users list with full details (admin only)
 */
export async function getUsersListFull(req: Request, res: Response) {
    try {
        const users = await userService.getUsersListFull();
        return success(res, users);
    } catch (err) {
        console.error("Get users full error:", err);
        return error(res, "Erro ao buscar lista de servas");
    }
}

/**
 * Create a new serva
 */
export async function createUser(req: Request, res: Response) {
    try {
        const { name, email, password, birthDate } = req.body;

        if (!name || !email || !password) {
            return badRequest(res, "Nome, email e senha são obrigatórios");
        }

        const user = await userService.createUser({ name, email, password, birthDate });
        return success(res, user, HTTP_STATUS.CREATED);
    } catch (err: any) {
        if (err.message === "EMAIL_EXISTS") {
            return badRequest(res, "Este email já está cadastrado");
        }
        console.error("Create user error:", err);
        return error(res, "Erro ao criar serva");
    }
}

/**
 * Update an existing serva
 */
export async function updateUser(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const { name, email, birthDate } = req.body;

        const user = await userService.updateUser(id, { name, email, birthDate });
        return success(res, user);
    } catch (err: any) {
        if (err.message === "EMAIL_EXISTS") {
            return badRequest(res, "Este email já está cadastrado por outra serva");
        }
        console.error("Update user error:", err);
        return error(res, "Erro ao atualizar serva");
    }
}

/**
 * Delete a serva and all related data
 */
export async function deleteUser(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        await userService.deleteUser(id);
        return success(res, { message: "Serva removida com sucesso" });
    } catch (err) {
        console.error("Delete user error:", err);
        return error(res, "Erro ao remover serva");
    }
}
