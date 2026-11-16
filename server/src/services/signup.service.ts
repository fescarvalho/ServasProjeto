import { prisma } from "../config/database";
import { SIGNUP_STATUS } from "../constants";

/**
 * Promote the next person in line from RESERVE to CONFIRMED
 * Called when a CONFIRMED signup is removed
 */
export async function promoteNextInLine(massId: string): Promise<void> {
    const mass = await prisma.mass.findUnique({
        where: { id: massId },
        include: { signups: { orderBy: { createdAt: "asc" } } },
    });

    if (!mass) return;

    const nextInLine = mass.signups.find((s) => s.status === SIGNUP_STATUS.RESERVE);

    if (nextInLine) {
        await prisma.signup.update({
            where: { id: nextInLine.id },
            data: { status: SIGNUP_STATUS.CONFIRMED },
        });
    }
}

/**
 * Toggle signup (join or leave a mass)
 */
export async function toggleSignup(userId: string, massId: string, isAdmin: boolean = false) {
    const mass = await prisma.mass.findUnique({
        where: { id: massId },
        include: {
            signups: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!mass) {
        throw new Error("Missa não encontrada");
    }

    // Check if mass is open for signups (bypass for ADMIN)
    if (!mass.open && !isAdmin) {
        throw new Error("Inscrições fechadas para esta missa.");
    }

    // Check deadline (bypass for ADMIN)
    if (mass.deadline && new Date() > mass.deadline && !isAdmin) {
        throw new Error("Prazo de inscrição encerrado.");
    }

    const existingSignup = mass.signups.find((s) => s.userId === userId);

    // SCENARIO A: LEAVE (remove signup)
    if (existingSignup) {
        await prisma.signup.delete({
            where: { id: existingSignup.id },
        });

        // If leaving person was CONFIRMED, promote next in line
        if (existingSignup.status === SIGNUP_STATUS.CONFIRMED) {
            await promoteNextInLine(massId);
        }

        return { message: "Signup removed successfully" };
    }

    // SCENARIO B: JOIN (create signup)
    const confirmedCount = mass.signups.filter(
        (s) => s.status === SIGNUP_STATUS.CONFIRMED
    ).length;

    let newStatus: "CONFIRMADO" | "RESERVA" = SIGNUP_STATUS.CONFIRMED;
    let message = "Signup confirmed successfully!";

    if (confirmedCount >= mass.maxServers) {
        newStatus = SIGNUP_STATUS.RESERVE;
        message = "Slots full. You are on the reserve list.";
    }

    await prisma.signup.create({
        data: {
            userId,
            massId,
            status: newStatus,
        },
    });

    return { message, status: newStatus };
}

/**
 * Change role of a signup
 */
export async function changeRole(signupId: string, role: string) {
    return await prisma.signup.update({
        where: { id: signupId },
        data: { role },
    });
}

/**
 * Toggle presence status
 */
export async function togglePresence(signupId: string) {
    const existing = await prisma.signup.findUnique({ where: { id: signupId } });

    if (!existing) {
        throw new Error("Signup not found");
    }

    return await prisma.signup.update({
        where: { id: signupId },
        data: { present: !existing.present },
    });
}

const VALID_QR_TOKENS = new Set(["SACRISTIA_ST_2026", "1"]);

/**
 * Self check-in by the server on the day/time window of the mass via Sacristy QR Code
 */
export async function selfCheckIn(signupId: string, userId: string, isAdmin: boolean = false, qrToken?: string) {
    if (!isAdmin && (!qrToken || !VALID_QR_TOKENS.has(String(qrToken)))) {
        throw new Error("Check-in permitido apenas escaneando o QR Code oficial na sacristia.");
    }

    const existing = await prisma.signup.findUnique({
        where: { id: signupId },
        include: { mass: true },
    });

    if (!existing) {
        throw new Error("Inscrição não encontrada.");
    }

    if (existing.userId !== userId && !isAdmin) {
        throw new Error("Você só pode confirmar sua própria presença.");
    }

    if (existing.status === SIGNUP_STATUS.RESERVE) {
        throw new Error("Inscrições na fila de espera não podem fazer check-in.");
    }

    if (!isAdmin) {
        const now = new Date();
        const massTime = new Date(existing.mass.date);
        const diffMinutes = (now.getTime() - massTime.getTime()) / (1000 * 60);

        // Permite check-in desde 2h antes do início da missa até 4h após o início
        if (diffMinutes < -120 || diffMinutes > 240) {
            throw new Error("O check-in só fica disponível a partir de 2 horas antes do início da missa.");
        }
    }

    return await prisma.signup.update({
        where: { id: signupId },
        data: { present: true },
    });
}

/**
 * Promote a signup from RESERVE to CONFIRMED
 */
export async function promoteSignup(signupId: string) {
    return await prisma.signup.update({
        where: { id: signupId },
        data: { status: SIGNUP_STATUS.CONFIRMED },
    });
}

/**
 * Remove a signup
 */
export async function removeSignup(signupId: string) {
    const signupToDelete = await prisma.signup.findUnique({
        where: { id: signupId },
    });

    if (!signupToDelete) {
        throw new Error("Signup not found");
    }

    await prisma.signup.delete({ where: { id: signupId } });

    // If removed signup was CONFIRMED, promote next in line
    if (signupToDelete.status === SIGNUP_STATUS.CONFIRMED) {
        await promoteNextInLine(signupToDelete.massId);
    }

    return { message: "Signup removed successfully" };
}

/**
 * Swap a signup (replace one user with another)
 */
export async function swapSignup(oldSignupId: string, newUserId: string) {
    const oldSignup = await prisma.signup.findUnique({
        where: { id: oldSignupId },
        include: { user: true },
    });

    if (!oldSignup) {
        throw new Error("Signup not found");
    }

    const outgoingName = oldSignup.user.name;

    await prisma.$transaction([
        prisma.signup.delete({ where: { id: oldSignupId } }),
        prisma.signup.create({
            data: {
                userId: newUserId,
                massId: oldSignup.massId,
                role: oldSignup.role,
                status: SIGNUP_STATUS.CONFIRMED,
                isSubstitution: true,
                substitutedName: outgoingName,
            },
        }),
    ]);

    return { message: "Swap completed successfully!" };
}
