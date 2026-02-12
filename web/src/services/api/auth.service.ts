import { apiClient } from "./client";
import { UserData } from "../../types/types";
import { storeUser, removeStoredUser } from "../storage/localStorage.service";

export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Realiza login do usuário
 */
export async function login(credentials: LoginCredentials): Promise<UserData> {
    const response = await apiClient.post<UserData>("/login", credentials);
    const userData = response.data;

    // Salva no localStorage
    storeUser(userData);

    return userData;
}

/**
 * Realiza logout do usuário
 */
export function logout(): void {
    removeStoredUser();
}
