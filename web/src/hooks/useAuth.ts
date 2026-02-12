import { useState } from "react";
import { UserData } from "../types/types";
import * as authService from "../services/api/auth.service";
import { getStoredUser } from "../services/storage/localStorage.service";

interface UseAuthReturn {
    user: UserData | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string;
}

/**
 * Hook para gerenciar autenticação
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<UserData | null>(() => getStoredUser());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function login(email: string, password: string): Promise<void> {
        try {
            setIsLoading(true);
            setError("");

            const userData = await authService.login({ email, password });
            setUser(userData);
        } catch (err) {
            console.error("Erro no login:", err);
            setError("E-mail ou senha incorretos.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }

    function logout(): void {
        authService.logout();
        setUser(null);
    }

    return {
        user,
        login,
        logout,
        isLoading,
        error,
    };
}
