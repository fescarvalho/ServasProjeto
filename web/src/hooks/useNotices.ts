import { useState, useEffect } from "react";
import { Notice } from "../types/types";
import * as noticeService from "../services/api/notice.service";

interface UseNoticesReturn {
    notices: Notice[];
    fetchNotices: () => Promise<void>;
}

/**
 * Hook para gerenciar avisos
 */
export function useNotices(): UseNoticesReturn {
    const [notices, setNotices] = useState<Notice[]>([]);

    async function fetchNotices(): Promise<void> {
        try {
            const data = await noticeService.getNotices();
            setNotices(data);
        } catch (error) {
            console.error("Erro ao buscar avisos:", error);
        }
    }

    useEffect(() => {
        fetchNotices();
    }, []);

    return {
        notices,
        fetchNotices,
    };
}
