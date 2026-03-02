import { APP_CONFIG } from "../../constants/config";
import { UserData } from "../../types/types";

const LAST_ONLINE_KEY = "servas_last_online";

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
        console.error("Erro ao remover usuário salvo:", error);
    }
}

/**
 * Salva o timestamp atual como "último momento online"
 */
export function setLastOnline(): void {
    try {
        localStorage.setItem(LAST_ONLINE_KEY, String(Date.now()));
    } catch (error) {
        console.error("Erro ao salvar last online:", error);
    }
}

/**
 * Retorna o timestamp da última vez que o app estava online
 */
export function getLastOnline(): number | null {
    try {
        const val = localStorage.getItem(LAST_ONLINE_KEY);
        return val ? Number(val) : null;
    } catch {
        return null;
    }
}

/**
 * Remove o timestamp de último online (usado no logout)
 */
export function clearLastOnline(): void {
    try {
        localStorage.removeItem(LAST_ONLINE_KEY);
    } catch (error) {
        console.error("Erro ao limpar last online:", error);
    }
}
