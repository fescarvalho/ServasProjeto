import { apiClient } from "./client";

export interface ServaData {
    id: string;
    name: string;
    email: string;
    role: string;
    birthDate: string | null;
}

/**
 * Busca lista completa de servas (admin only)
 */
export async function getServasList(): Promise<ServaData[]> {
    const response = await apiClient.get<ServaData[]>("/users/list-full");
    return response.data;
}

/**
 * Cria uma nova serva
 */
export async function createServa(data: {
    name: string;
    email: string;
    password: string;
    birthDate?: string;
    role?: string;
}): Promise<ServaData> {
    const response = await apiClient.post<ServaData>("/users", data);
    return response.data;
}

/**
 * Atualiza dados de uma serva existente
 */
export async function updateServa(
    id: string,
    data: { name?: string; email?: string; birthDate?: string; role?: string }
): Promise<ServaData> {
    const response = await apiClient.put<ServaData>(`/users/${id}`, data);
    return response.data;
}

/**
 * Remove uma serva e todos os dados relacionados
 */
export async function deleteServa(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
}
