import { prisma } from "../config/database";

const META_PREFIX = "__SYS_USER_META__:";

export interface UnavailabilityItem {
    date: string; // YYYY-MM-DD
    reason?: string;
}

export interface SystemUserMeta {
    genders: Record<string, "M" | "F">;
    unavailabilities: Record<string, UnavailabilityItem[]>;
}

/**
 * Lê os metadados persistidos (gênero e indisponibilidades) sem exigir migração destrutiva no banco
 */
export async function getSystemUserMeta(): Promise<SystemUserMeta> {
    try {
        const record = await prisma.notice.findFirst({
            where: {
                active: false,
                text: { startsWith: META_PREFIX },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!record) {
            return { genders: {}, unavailabilities: {} };
        }

        const jsonStr = record.text.slice(META_PREFIX.length);
        const parsed = JSON.parse(jsonStr);
        return {
            genders: parsed.genders || {},
            unavailabilities: parsed.unavailabilities || {},
        };
    } catch (err) {
        console.error("[UserMeta] Erro ao ler metadados:", err);
        return { genders: {}, unavailabilities: {} };
    }
}

async function saveSystemUserMeta(meta: SystemUserMeta): Promise<void> {
    const payload = META_PREFIX + JSON.stringify(meta);
    const existing = await prisma.notice.findFirst({
        where: {
            active: false,
            text: { startsWith: META_PREFIX },
        },
        orderBy: { createdAt: "desc" },
    });

    if (existing) {
        await prisma.notice.update({
            where: { id: existing.id },
            data: { text: payload, active: false },
        });
    } else {
        await prisma.notice.create({
            data: { text: payload, active: false },
        });
    }
}

/**
 * Get all users (id, name, gender, unavailabilities) — para selects de inscrição e sorteio automático
 */
export async function getUsersList() {
    const [users, meta] = await Promise.all([
        prisma.user.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        getSystemUserMeta(),
    ]);

    return users.map((u) => ({
        ...u,
        gender: meta.genders[u.id] || null,
        unavailabilities: meta.unavailabilities[u.id] || [],
    }));
}

/**
 * Get all users with full details (for Servos management tab)
 */
export async function getUsersListFull() {
    const [users, meta] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                birthDate: true,
            },
            orderBy: { name: "asc" },
        }),
        getSystemUserMeta(),
    ]);

    return users.map((u) => ({
        ...u,
        gender: meta.genders[u.id] || null,
        unavailabilities: meta.unavailabilities[u.id] || [],
    }));
}

/**
 * Create a new servo(a) (user)
 */
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    birthDate?: string;
    role?: string;
    gender?: "M" | "F" | "";
}) {
    // Verificar se email já existe
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        throw new Error("EMAIL_EXISTS");
    }

    const created = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            birthDate: data.birthDate ? new Date(data.birthDate + "T12:00:00") : null,
            role: data.role || "USER",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
    });

    if (data.gender === "M" || data.gender === "F") {
        const meta = await getSystemUserMeta();
        meta.genders[created.id] = data.gender;
        await saveSystemUserMeta(meta);
    }

    return {
        ...created,
        gender: data.gender === "M" || data.gender === "F" ? data.gender : null,
    };
}

/**
 * Update an existing servo(a)
 */
export async function updateUser(
    id: string,
    data: { name?: string; email?: string; birthDate?: string; role?: string; gender?: "M" | "F" | "" }
) {
    // Se estiver mudando email, verificar duplicidade
    if (data.email) {
        const existing = await prisma.user.findFirst({
            where: {
                email: data.email,
                id: { not: id },
            },
        });

        if (existing) {
            throw new Error("EMAIL_EXISTS");
        }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.birthDate !== undefined) {
        updateData.birthDate = data.birthDate ? new Date(data.birthDate + "T12:00:00") : null;
    }

    const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
    });

    const meta = await getSystemUserMeta();
    if (data.gender !== undefined) {
        if (data.gender === "M" || data.gender === "F") {
            meta.genders[id] = data.gender;
        } else {
            delete meta.genders[id];
        }
        await saveSystemUserMeta(meta);
    }

    return {
        ...updated,
        gender: meta.genders[id] || null,
    };
}

/**
 * Adiciona ou atualiza uma indisponibilidade programada para um usuário
 */
export async function addUserUnavailability(userId: string, date: string, reason?: string) {
    const meta = await getSystemUserMeta();
    const list = meta.unavailabilities[userId] || [];
    const filtered = list.filter((item) => item.date !== date);
    filtered.push({ date, reason: reason?.trim() || "Indisponível" });
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    meta.unavailabilities[userId] = filtered;
    await saveSystemUserMeta(meta);
    return filtered;
}

/**
 * Remove uma indisponibilidade programada de um usuário
 */
export async function removeUserUnavailability(userId: string, date: string) {
    const meta = await getSystemUserMeta();
    const list = meta.unavailabilities[userId] || [];
    meta.unavailabilities[userId] = list.filter((item) => item.date !== date);
    await saveSystemUserMeta(meta);
    return meta.unavailabilities[userId];
}

/**
 * Delete a servo(a) and all related data (signups, logs, subscriptions, swap requests)
 */
export async function deleteUser(id: string) {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Buscar todos os signups do usuário para remover swap requests vinculados
        const signups = await tx.signup.findMany({
            where: { userId: id },
            select: { id: true },
        });

        const signupIds = signups.map((s) => s.id);

        // 2. Remover swap requests ligados aos signups
        if (signupIds.length > 0) {
            await tx.swapRequest.deleteMany({
                where: { signupId: { in: signupIds } },
            });
        }

        // 3. Remover swap requests onde este usuário é o requester
        await tx.swapRequest.deleteMany({
            where: { requesterId: id },
        });

        // 4. Remover signups
        await tx.signup.deleteMany({
            where: { userId: id },
        });

        // 5. Remover login logs
        await tx.loginLog.deleteMany({
            where: { userId: id },
        });

        // 6. Remover push subscriptions
        await tx.pushSubscription.deleteMany({
            where: { userId: id },
        });

        // 7. Finalmente, remover o usuário
        await tx.user.delete({
            where: { id },
        });

        return { deleted: true };
    });

    try {
        const meta = await getSystemUserMeta();
        delete meta.genders[id];
        delete meta.unavailabilities[id];
        await saveSystemUserMeta(meta);
    } catch (e) {
        console.error("[UserMeta] Erro ao limpar metadados do usuário removido:", e);
    }

    return result;
}
