import { APP_CONFIG } from "../constants/config";

/**
 * Formata uma data para o formato brasileiro
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("pt-BR", options);
}

/**
 * Formata o horário de uma data
 */
export function formatTime(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formata data e hora completos
 */
export function formatDateTime(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Verifica se uma data/prazo já expirou
 */
export function isExpired(massDate: string, deadline?: string): boolean {
    const now = new Date();
    if (deadline) {
        return new Date(deadline) < now;
    }
    return new Date(massDate) < now;
}

/**
 * Converte uma data para o formato local (sem timezone offset)
 */
export function toLocalDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
}

/**
 * Converte uma data para datetime-local format
 */
export function toLocalDateTime(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Obtém a data no timezone do Brasil
 */
export function toBrazilianDate(date: string | Date): Date {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Date(dateObj.toLocaleString("en-US", { timeZone: APP_CONFIG.TIMEZONE }));
}

/**
 * Verifica se duas datas estão no mesmo mês e ano
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
    return (
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

/**
 * Obtém o nome do mês em português
 */
export function getMonthName(date: Date): string {
    return date.toLocaleDateString("pt-BR", { month: "long" });
}
