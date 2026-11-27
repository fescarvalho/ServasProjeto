import { apiClient } from "./client";

export interface UnavailabilityItem {
    date: string;
    reason?: string;
}

export interface ScaleSuspension {
    from: string;
    until: string;
    reason?: string;
    createdAt?: string;
}

export interface ServaData {
    id: string;
    name: string;
    email: string;
    role: string;
    birthDate: string | null;
    gender?: "M" | "F" | null;
    unavailabilities?: UnavailabilityItem[];
    suspension?: ScaleSuspension | null;
    lastMassDate?: string | null;
    firstLoginDate?: string | null;
}

export interface UserMetadataResponse {
    genders: Record<string, "M" | "F">;
    unavailabilities: Record<string, UnavailabilityItem[]>;
    myUnavailabilities?: UnavailabilityItem[];
    suspensions?: Record<string, ScaleSuspension>;
    mySuspension?: ScaleSuspension | null;
    shortNames?: Record<string, string>;
    shortNamesByFull?: Record<string, string>;
}

/**
 * Busca metadados de todos os usuários (gênero + indisponibilidades)
 */
export async function getUserMetadata(): Promise<UserMetadataResponse> {
    const response = await apiClient.get<UserMetadataResponse>("/users/metadata", {
        params: { _t: Date.now() },
    });
    return response.data;
}

/**
 * Busca as indisponibilidades programadas do próprio usuário autenticado
 */
export async function getMyUnavailabilities(): Promise<UnavailabilityItem[]> {
    const response = await apiClient.get<UnavailabilityItem[]>("/users/unavailability", {
        params: { _t: Date.now() },
    });
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

/**
 * Define suspensão temporária de escalas (o membro mantém acesso ao app, mas não pode pegar escalas)
 */
export async function setUserSuspension(
    id: string,
    data: { from: string; until: string; reason?: string }
): Promise<ScaleSuspension> {
    const response = await apiClient.put<ScaleSuspension>(`/users/${id}/suspension`, data);
    return response.data;
}

/**
 * Remove a suspensão temporária de escalas de um membro
 */
export async function removeUserSuspension(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}/suspension`);
}
