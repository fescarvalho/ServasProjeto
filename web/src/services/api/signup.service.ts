import { apiClient } from "./client";

/**
 * Inscreve ou desinscreve um usuário de uma missa
 */
export async function toggleSignup(userId: string, massId: string): Promise<void> {
    await apiClient.post("/signup/toggle-signup", { userId, massId });
}

/**
 * Altera a função de uma inscrição
 */
export async function changeRole(signupId: string, role: string): Promise<void> {
    await apiClient.patch(`/signup/${signupId}/role`, { role });
}

/**
 * Alterna a presença de uma inscrição (Admin)
 */
export async function togglePresence(signupId: string): Promise<void> {
    await apiClient.patch(`/signup/${signupId}/toggle-presence`);
}

/**
 * Realiza check-in de presença pelo próprio servo(a) no dia/horário da missa via QR Code da Sacristia
 */
export async function selfCheckIn(signupId: string, token: string = "SACRISTIA_ST_2026"): Promise<void> {
    await apiClient.post(`/signup/${signupId}/checkin`, { token });
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
 * Troca um(a) servo(a) por outro(a)
 */
export async function swapSignup(oldSignupId: string, newUserId: string): Promise<void> {
    await apiClient.post("/signup/swap", {
        oldSignupId,
        newUserId,
    });
}
