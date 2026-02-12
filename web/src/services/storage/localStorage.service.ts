import { APP_CONFIG } from "../../constants/config";
import { UserData } from "../../types/types";

/**
 * Salva o usuário no localStorage
 */
export function storeUser(user: UserData): void {
    try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
    }
}

/**
 * Obtém o usuário do localStorage
 */
export function getStoredUser(): UserData | null {
    try {
        const storedUser = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (error) {
        console.error("Erro ao ler usuário salvo:", error);
    }
    return null;
}

/**
 * Remove o usuário do localStorage
 */
export function removeStoredUser(): void {
    try {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEY);
    } catch (error) {
        console.error("Erro ao remover usuário:", error);
    }
}
