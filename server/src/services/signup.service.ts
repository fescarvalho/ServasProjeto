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
export async function toggleSignup(userId: string, massId: string) {
    const mass = await prisma.mass.findUnique({
        where: { id: massId },
        include: {
            signups: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!mass) {
        throw new Error("Mass not found");
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
