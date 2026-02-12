import { apiClient } from "./client";

/**
 * Inscreve ou desinscreve um usuário de uma missa
 */
export async function toggleSignup(userId: string, massId: string): Promise<void> {
    await apiClient.post("/toggle-signup", { userId, massId });
}

/**
 * Altera a função de uma inscrição
 */
export async function changeRole(signupId: string, role: string): Promise<void> {
    await apiClient.patch(`/signup/${signupId}/role`, { role });
}

/**
 * Alterna a presença de uma inscrição
 */
export async function togglePresence(signupId: string): Promise<void> {
    await apiClient.patch(`/signup/${signupId}/toggle-presence`);
}

/**
 * Promove uma reserva para confirmado
 */
export async function promoteSignup(signupId: string): Promise<void> {
    await apiClient.patch(`/signup/${signupId}/promote`);
}

/**
 * Remove uma inscrição
 */
export async function removeSignup(signupId: string): Promise<void> {
    await apiClient.delete(`/signup/${signupId}`);
}

/**
 * Troca uma serva por outra
 */
export async function swapSignup(oldSignupId: string, newUserId: string): Promise<void> {
    await apiClient.post("/signup/swap", {
        oldSignupId,
        newUserId,
    });
}
