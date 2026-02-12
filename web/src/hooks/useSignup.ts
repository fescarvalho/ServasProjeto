import { useCallback } from "react";
import * as signupService from "../services/api/signup.service";

interface UseSignupReturn {
    toggleSignup: (userId: string, massId: string) => Promise<void>;
    changeRole: (signupId: string, role: string) => Promise<void>;
    togglePresence: (signupId: string) => Promise<void>;
    promoteSignup: (signupId: string) => Promise<void>;
    removeSignup: (signupId: string) => Promise<void>;
    swapSignup: (oldSignupId: string, newUserId: string) => Promise<void>;
}

/**
 * Hook para gerenciar inscrições
 */
export function useSignup(onUpdate?: () => void): UseSignupReturn {
    const toggleSignup = useCallback(async (userId: string, massId: string) => {
        try {
            await signupService.toggleSignup(userId, massId);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao inscrever/desinscrever:", error);
            throw error;
        }
    }, [onUpdate]);

    const changeRole = useCallback(async (signupId: string, role: string) => {
        try {
            await signupService.changeRole(signupId, role);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao alterar função:", error);
            throw error;
        }
    }, [onUpdate]);

    const togglePresence = useCallback(async (signupId: string) => {
        try {
            await signupService.togglePresence(signupId);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao marcar presença:", error);
            throw error;
        }
    }, [onUpdate]);

    const promoteSignup = useCallback(async (signupId: string) => {
        try {
            await signupService.promoteSignup(signupId);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao promover:", error);
            throw error;
        }
    }, [onUpdate]);

    const removeSignup = useCallback(async (signupId: string) => {
        try {
            await signupService.removeSignup(signupId);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao remover:", error);
            throw error;
        }
    }, [onUpdate]);

    const swapSignup = useCallback(async (oldSignupId: string, newUserId: string) => {
        try {
            await signupService.swapSignup(oldSignupId, newUserId);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao trocar:", error);
            throw error;
        }
    }, [onUpdate]);

    return {
        toggleSignup,
        changeRole,
        togglePresence,
        promoteSignup,
        removeSignup,
        swapSignup,
    };
}
