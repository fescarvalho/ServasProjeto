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
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        const [meta, isAdmin, shortNamesData] = await Promise.all([
            userService.getSystemUserMeta(),
            isRequestAdmin(req.userId),
            userService.getActiveShortNamesData(),
        ]);
        const todayBr = userService.getBrazilTodayStr();
        const activeSuspensions: Record<string, userService.ScaleSuspension> = {};
        for (const [uid, s] of Object.entries(meta.suspensions || {})) {
            if (s && s.until >= todayBr) {
                activeSuspensions[uid] = s;
            }
        }
        const mySuspension = req.userId ? activeSuspensions[req.userId] || null : null;

        if (isAdmin) {
            return success(res, {
                genders: meta.genders,
                unavailabilities: meta.unavailabilities,
                myUnavailabilities: req.userId ? meta.unavailabilities[req.userId] || [] : [],
                suspensions: activeSuspensions,
                mySuspension,
                shortNames: shortNamesData.byId,
                shortNamesByFull: shortNamesData.byFullName,
            });
        }
        return success(res, {
            genders: meta.genders,
            unavailabilities:
                req.userId && meta.unavailabilities[req.userId]
                    ? { [req.userId]: meta.unavailabilities[req.userId] }
                    : {},
            myUnavailabilities: req.userId ? meta.unavailabilities[req.userId] || [] : [],
            mySuspension,
            shortNames: shortNamesData.byId,
            shortNamesByFull: shortNamesData.byFullName,
        });
    } catch (err) {
        console.error("Get user meta error:", err);
        return error(res, "Erro ao buscar metadados");
    }
}

/**
 * Get unavailabilities for the authenticated user
 */
export async function getMyUnavailabilities(req: Request, res: Response) {
    try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        const userId = req.userId;
        if (!userId) return badRequest(res, "Usuário não autenticado");

        const list = await userService.getUserUnavailabilities(userId);
        return success(res, list);
    } catch (err) {
        console.error("Get my unavailabilities error:", err);
        return error(res, "Erro ao buscar indisponibilidades");
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

/**
 * Set temporary scale suspension for a servo(a) (admin only)
 */
export async function setSuspension(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const { from, until, reason } = req.body || {};
        if (!from || !until) {
            return badRequest(res, "Informe a data inicial e final da suspensão.");
        }
        const suspension = await userService.setUserSuspension(id, { from, until, reason });
        return success(res, suspension);
    } catch (err: any) {
        if (err.message === "INVALID_SUSPENSION_DATES") {
            return badRequest(res, "Formato de data inválido.");
        }
        if (err.message === "INVALID_SUSPENSION_RANGE") {
            return badRequest(res, "A data final deve ser igual ou posterior à data inicial.");
        }
        console.error("Set suspension error:", err);
        return error(res, "Erro ao registrar suspensão");
    }
}

/**
 * Remove scale suspension for a servo(a) (admin only)
 */
export async function removeSuspension(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        await userService.removeUserSuspension(id);
        return success(res, { removed: true });
    } catch (err) {
        console.error("Remove suspension error:", err);
        return error(res, "Erro ao remover suspensão");
    }
}
