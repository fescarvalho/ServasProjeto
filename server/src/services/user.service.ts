import { prisma } from "../config/database";

/**
 * Get all users (id and name only) — para selects de inscrição
 */
export async function getUsersList() {
    return await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Get all users with full details (for Servas management tab)
 */
export async function getUsersListFull() {
    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
        orderBy: { name: "asc" },
    });
}

/**
 * Create a new serva (user)
 */
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    birthDate?: string;
}) {
    // Verificar se email já existe
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        throw new Error("EMAIL_EXISTS");
    }

    return await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            birthDate: data.birthDate ? new Date(data.birthDate + "T12:00:00") : null,
            role: "USER",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
    });
}

/**
 * Update an existing serva
 */
export async function updateUser(
    id: string,
    data: { name?: string; email?: string; birthDate?: string }
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
    if (data.birthDate !== undefined) {
        updateData.birthDate = data.birthDate ? new Date(data.birthDate + "T12:00:00") : null;
    }

    return await prisma.user.update({
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
}

/**
 * Delete a serva and all related data (signups, logs, subscriptions, swap requests)
 */
export async function deleteUser(id: string) {
    return await prisma.$transaction(async (tx) => {
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
}
