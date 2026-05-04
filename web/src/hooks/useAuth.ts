import { useState } from "react";
import { UserData } from "../types/types";
import * as authService from "../services/api/auth.service";
import { getStoredUser, setLastOnline, clearLastOnline } from "../services/storage/localStorage.service";

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

            // Registra o momento do login como "online"
            setLastOnline();
        } catch (err: any) {
            console.error("Erro no login:", err);
            
            if (err.response) {
                // O servidor respondeu com um erro (ex: 401, 400, 500)
                if (err.response.status === 401) {
                    setError("E-mail ou senha incorretos.");
                } else {
                    setError(err.response.data?.error || "Erro no servidor. Tente novamente.");
                }
            } else if (err.request) {
                // A requisição foi feita mas não houve resposta (erro de rede)
                setError("Erro de conexão. Verifique sua internet.");
            } else {
                setError("Ocorreu um erro inesperado.");
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    }

    function logout(): void {
        authService.logout();
        clearLastOnline();
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
