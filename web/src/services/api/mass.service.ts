import { apiClient } from "./client";
import { Mass } from "../../types/types";

export interface CreateMassData {
    date: string;
    time?: string;
    name?: string;
    maxServers: number;
    deadline?: string | null;
}

export interface UpdateMassData extends Partial<CreateMassData> { }

/**
 * Busca todas as missas
 */
export async function getMasses(): Promise<Mass[]> {
    const timestamp = new Date().getTime();
    const response = await apiClient.get<Mass[]>(`/masses?t=${timestamp}`);

    // Ordena por data
    return response.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

/**
 * Cria uma nova missa
 */
export async function createMass(data: CreateMassData): Promise<Mass> {
    const response = await apiClient.post<Mass>("/masses", data);
    return response.data;
}

/**
 * Atualiza uma missa existente
 */
export async function updateMass(id: string, data: UpdateMassData): Promise<Mass> {
    const response = await apiClient.put<Mass>(`/masses/${id}`, data);
    return response.data;
}

/**
 * Deleta uma missa
 */
export async function deleteMass(id: string): Promise<void> {
    await apiClient.delete(`/masses/${id}`);
}

/**
 * Alterna o status de publicação de uma missa
 */
export async function togglePublish(id: string, published: boolean): Promise<Mass> {
    const response = await apiClient.patch<Mass>(`/masses/${id}`, { published });
    return response.data;
}

/**
 * Alterna o status de abertura de inscrições
 */
export async function toggleOpen(id: string, open: boolean): Promise<Mass> {
    const response = await apiClient.patch<Mass>(`/masses/${id}/toggle-open`, { open });
    return response.data;
}
