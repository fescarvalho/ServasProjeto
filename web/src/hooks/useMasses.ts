import { useState, useCallback } from "react";
import { Mass } from "../types/types";
import * as massService from "../services/api/mass.service";

interface UseMassesReturn {
    masses: Mass[];
    isLoading: boolean;
    fetchMasses: () => Promise<void>;
    createMass: (data: massService.CreateMassData) => Promise<void>;
    updateMass: (id: string, data: massService.UpdateMassData) => Promise<void>;
    deleteMass: (id: string) => Promise<void>;
    togglePublish: (id: string, published: boolean) => Promise<void>;
    toggleOpen: (id: string, open: boolean) => Promise<void>;
}

/**
 * Hook para gerenciar missas
 */
export function useMasses(): UseMassesReturn {
    const [masses, setMasses] = useState<Mass[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMasses = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await massService.getMasses();
            setMasses(data);
        } catch (error) {
            console.error("Erro ao buscar missas:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createMass = useCallback(async (data: massService.CreateMassData) => {
        try {
            await massService.createMass(data);
            await fetchMasses();
        } catch (error) {
            console.error("Erro ao criar missa:", error);
            throw error;
        }
    }, [fetchMasses]);

    const updateMass = useCallback(async (id: string, data: massService.UpdateMassData) => {
        try {
            await massService.updateMass(id, data);
            await fetchMasses();
        } catch (error) {
            console.error("Erro ao atualizar missa:", error);
            throw error;
        }
    }, [fetchMasses]);

    const deleteMass = useCallback(async (id: string) => {
        try {
            await massService.deleteMass(id);
            await fetchMasses();
        } catch (error) {
            console.error("Erro ao deletar missa:", error);
            throw error;
        }
    }, [fetchMasses]);

    const togglePublish = useCallback(async (id: string, published: boolean) => {
        try {
            await massService.togglePublish(id, published);
            await fetchMasses();
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            throw error;
        }
    }, [fetchMasses]);

    const toggleOpen = useCallback(async (id: string, open: boolean) => {
        try {
            await massService.toggleOpen(id, open);
            await fetchMasses();
        } catch (error) {
            console.error("Erro ao alterar cadeado:", error);
            throw error;
        }
    }, [fetchMasses]);

    return {
        masses,
        isLoading,
        fetchMasses,
        createMass,
        updateMass,
        deleteMass,
        togglePublish,
        toggleOpen,
    };
}
