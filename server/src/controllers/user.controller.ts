import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { prisma } from "../config/database";
import { success, error, badRequest } from "../utils/response.utils";
import { HTTP_STATUS } from "../constants";

async function isRequestAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return u?.role === "ADMIN";
}

/**
 * Get users list (id + name + gender + unavailabilities for admin)
 */
export async function getUsersList(req: Request, res: Response) {
    try {
        const [users, isAdmin] = await Promise.all([
            userService.getUsersList(),
            isRequestAdmin(req.userId),
        ]);
        if (isAdmin) {
            return success(res, users);
        }
        const filtered = users.map((u) => ({
            id: u.id,
            name: u.name,
            gender: u.gender,
            unavailabilities: u.id === req.userId ? u.unavailabilities : [],
        }));
        return success(res, filtered);
    } catch (err) {
        console.error("Get users error:", err);
        return error(res, "Error fetching users");
    }
}

/**
 * Get system user metadata (genders + unavailabilities; non-admins only see own unavailabilities)
 */
export async function getUserMeta(req: Request, res: Response) {
    try {
        const [meta, isAdmin] = await Promise.all([
            userService.getSystemUserMeta(),
            isRequestAdmin(req.userId),
        ]);
        if (isAdmin) {
            return success(res, {
                genders: meta.genders,
                unavailabilities: meta.unavailabilities,
            });
        }
        return success(res, {
            genders: meta.genders,
            unavailabilities:
                req.userId && meta.unavailabilities[req.userId]
                    ? { [req.userId]: meta.unavailabilities[req.userId] }
                    : {},
        });
    } catch (err) {
        console.error("Get user meta error:", err);
        return error(res, "Erro ao buscar metadados");
    }
}

/**
 * Add unavailability for the authenticated user
 */
export async function addUnavailability(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) return badRequest(res, "Usuário não autenticado");

        const { date, reason } = req.body;
        if (!date) return badRequest(res, "A data é obrigatória");

        const list = await userService.addUserUnavailability(userId, date, reason);
        return success(res, list);
    } catch (err) {
        console.error("Add unavailability error:", err);
        return error(res, "Erro ao registrar indisponibilidade");
    }
}

/**
 * Remove unavailability for the authenticated user
 */
export async function removeUnavailability(req: Request, res: Response) {
    try {
        const userId = req.userId;
        if (!userId) return badRequest(res, "Usuário não autenticado");

        const date = req.params.date as string;
        if (!date) return badRequest(res, "A data é obrigatória");

        const list = await userService.removeUserUnavailability(userId, date);
        return success(res, list);
    } catch (err) {
        console.error("Remove unavailability error:", err);
        return error(res, "Erro ao remover indisponibilidade");
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
        return error(res, "Erro ao buscar lista de servos");
    }
}

/**
 * Create a new servo(a)
 */
export async function createUser(req: Request, res: Response) {
    try {
        const { name, email, password, birthDate, role, gender } = req.body;

        if (!name || !email || !password) {
            return badRequest(res, "Nome, email e senha são obrigatórios");
        }

        const user = await userService.createUser({ name, email, password, birthDate, role, gender });
        return success(res, user, HTTP_STATUS.CREATED);
    } catch (err: any) {
        if (err.message === "EMAIL_EXISTS") {
            return badRequest(res, "Este email já está cadastrado");
        }
        console.error("Create user error:", err);
        return error(res, "Erro ao criar cadastro");
    }
}

/**
 * Update an existing servo(a)
 */
export async function updateUser(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const { name, email, birthDate, role, gender } = req.body;

        const user = await userService.updateUser(id, { name, email, birthDate, role, gender });
        return success(res, user);
    } catch (err) {
        if ((err as any).message === "EMAIL_EXISTS") {
            return badRequest(res, "Este email já está cadastrado por outro membro");
        }
        console.error("Update user error:", err);
        return error(res, "Erro ao atualizar cadastro");
    }
}

/**
 * Delete a servo(a) and all related data
 */
export async function deleteUser(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        await userService.deleteUser(id);
        return success(res, { message: "Cadastro removido com sucesso" });
    } catch (err) {
        console.error("Delete user error:", err);
        return error(res, "Erro ao remover cadastro");
    }
}
