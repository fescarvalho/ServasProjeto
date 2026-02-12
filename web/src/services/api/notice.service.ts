import { apiClient } from "./client";
import { Notice } from "../../types/types";

/**
 * Busca todos os avisos ativos
 */
export async function getNotices(): Promise<Notice[]> {
    const response = await apiClient.get<Notice[]>("/notices");
    return response.data;
}

/**
 * Busca lista de usuários (admin only)
 */
export async function getUsersList(): Promise<{ id: string; name: string }[]> {
    const response = await apiClient.get<{ id: string; name: string }[]>("/users/list");
    return response.data;
}
