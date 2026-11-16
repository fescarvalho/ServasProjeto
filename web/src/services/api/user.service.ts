import { apiClient } from "./client";

export interface UnavailabilityItem {
    date: string;
    reason?: string;
}

export interface ServaData {
    id: string;
    name: string;
    email: string;
    role: string;
    birthDate: string | null;
    gender?: "M" | "F" | null;
    unavailabilities?: UnavailabilityItem[];
    lastMassDate?: string | null;
}

export interface UserMetadataResponse {
    genders: Record<string, "M" | "F">;
    unavailabilities: Record<string, UnavailabilityItem[]>;
}

/**
 * Busca metadados de todos os usuários (gênero + indisponibilidades)
 */
export async function getUserMetadata(): Promise<UserMetadataResponse> {
    const response = await apiClient.get<UserMetadataResponse>("/users/metadata");
    return response.data;
}

/**
 * Registra uma data de indisponibilidade para o usuário autenticado
 */
export async function addUnavailability(date: string, reason?: string): Promise<UnavailabilityItem[]> {
    const response = await apiClient.post<UnavailabilityItem[]>("/users/unavailability", { date, reason });
    return response.data;
}

/**
 * Remove uma data de indisponibilidade do usuário autenticado
 */
export async function removeUnavailability(date: string): Promise<UnavailabilityItem[]> {
    const response = await apiClient.delete<UnavailabilityItem[]>(`/users/unavailability/${date}`);
    return response.data;
}

/**
 * Busca lista completa de servos(as) (admin only)
 */
export async function getServasList(): Promise<ServaData[]> {
    const response = await apiClient.get<ServaData[]>("/users/list-full");
    return response.data;
}

/**
 * Cria um(a) novo(a) servo(a)
 */
export async function createServa(data: {
    name: string;
    email: string;
    password: string;
    birthDate?: string;
    role?: string;
    gender?: "M" | "F" | "";
}): Promise<ServaData> {
    const response = await apiClient.post<ServaData>("/users", data);
    return response.data;
}

/**
 * Atualiza dados de um(a) servo(a) existente
 */
export async function updateServa(
    id: string,
    data: { name?: string; email?: string; birthDate?: string; role?: string; gender?: "M" | "F" | "" }
): Promise<ServaData> {
    const response = await apiClient.put<ServaData>(`/users/${id}`, data);
    return response.data;
}

/**
 * Remove um(a) servo(a) e todos os dados relacionados
 */
export async function deleteServa(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
}
