import { prisma } from "../config/database";
import { swapSignup } from "./signup.service";

/**
 * List all PENDING swap requests with related data
 */
export async function getOpenSwapRequests() {
    return await prisma.swapRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
            requester: { select: { id: true, name: true } },
            signup: {
                include: {
                    mass: { select: { id: true, date: true, name: true } },
                    user: { select: { id: true, name: true } },
                },
            },
        },
    });
}

/**
 * Create a swap request for a given signup
 */
export async function createSwapRequest(signupId: string, requesterId: string) {
    // Check the signup exists and belongs to the requester
    const signup = await prisma.signup.findUnique({
        where: { id: signupId },
        include: { mass: true },
    });

    if (!signup) throw new Error("Inscrição não encontrada.");
    if (signup.userId !== requesterId) throw new Error("Você não pode pedir substituição por outra serva.");

    // Check mass hasn't already happened
    if (new Date(signup.mass.date) < new Date()) {
        throw new Error("Não é possível pedir substituição para missas já realizadas.");
    }

    // Check no pending request already exists for this signup
    const existing = await prisma.swapRequest.findUnique({
        where: { signupId },
    });
    if (existing && existing.status === "PENDING") {
        throw new Error("Já existe um pedido de substituição em aberto para esta missa.");
    }

    return await prisma.swapRequest.create({
        data: { signupId, requesterId, status: "PENDING" },
    });
}

/**
 * Accept a swap request — performs the swap and marks request as ACCEPTED
 */
export async function acceptSwapRequest(swapRequestId: string, acceptorId: string) {
    const swapReq = await prisma.swapRequest.findUnique({
        where: { id: swapRequestId },
        include: { signup: true },
    });

    if (!swapReq) throw new Error("Pedido de substituição não encontrado.");
    if (swapReq.status !== "PENDING") throw new Error("Este pedido já foi processado.");

    // Acceptor cannot be the same as the requester
    if (swapReq.requesterId === acceptorId) {
        throw new Error("Você não pode aceitar seu próprio pedido de substituição.");
    }

    // Check acceptor isn't already signed up for this mass
    const alreadyIn = await prisma.signup.findUnique({
        where: { userId_massId: { userId: acceptorId, massId: swapReq.signup.massId } },
    });
    if (alreadyIn) throw new Error("Você já está inscrita nesta missa.");

    // Perform the actual swap using existing logic
    await swapSignup(swapReq.signupId, acceptorId);

    // The old signup was deleted by swapSignup, but signupId unique constraint on SwapRequest
    // means we just update the status (the swapRequest row survives for record-keeping)
    await prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: "ACCEPTED" },
    });

    return { message: "Substituição realizada com sucesso!" };
}

/**
 * Cancel a swap request (only the requester or an Admin can cancel)
 */
export async function cancelSwapRequest(swapRequestId: string, userId: string) {
    const swapReq = await prisma.swapRequest.findUnique({ where: { id: swapRequestId } });

    if (!swapReq) throw new Error("Pedido de substituição não encontrado.");
    if (swapReq.status !== "PENDING") throw new Error("Este pedido já foi processado.");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Usuário não encontrado.");

    const isAdmin = user.role === "ADMIN";
    if (swapReq.requesterId !== userId && !isAdmin) {
        throw new Error("Você não tem permissão para cancelar este pedido.");
    }

    return await prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: "CANCELLED" },
    });
}
