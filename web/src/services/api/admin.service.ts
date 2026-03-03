import { apiClient } from "./client";

export interface LoginLog {
    id: string;
    userId: string;
    timestamp: string;
    user: {
        name: string;
    };
}

/**
 * Busca os últimos 100 logs de login (somente Admin)
 */
export async function getLoginLogs(): Promise<LoginLog[]> {
    const response = await apiClient.get<LoginLog[]>("/admin/logs");
    return response.data;
}
