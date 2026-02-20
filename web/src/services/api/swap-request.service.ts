import { apiClient } from "./client";

export interface SwapRequestData {
    id: string;
    signupId: string;
    requesterId: string;
    status: "PENDING" | "ACCEPTED" | "CANCELLED";
    createdAt: string;
    requester: { id: string; name: string };
    signup: {
        id: string;
        role: string | null;
        mass: { id: string; date: string; name?: string };
        user: { id: string; name: string };
    };
}

/**
 * Busca todos os pedidos de substituição em aberto
 */
export async function getOpenSwapRequests(): Promise<SwapRequestData[]> {
    const response = await apiClient.get<SwapRequestData[]>("/swap-requests");
    return response.data;
}

/**
 * Cria um pedido de substituição
 */
export async function createSwapRequest(signupId: string, requesterId: string): Promise<void> {
    await apiClient.post("/swap-requests", { signupId, requesterId });
}

/**
 * Aceita e executa uma substituição
 */
export async function acceptSwapRequest(swapRequestId: string, acceptorId: string): Promise<void> {
    await apiClient.post(`/swap-requests/${swapRequestId}/accept`, { acceptorId });
}

/**
 * Cancela um pedido de substituição
 */
export async function cancelSwapRequest(swapRequestId: string, userId: string): Promise<void> {
    await apiClient.delete(`/swap-requests/${swapRequestId}`, { data: { userId } });
}
