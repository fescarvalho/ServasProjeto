import { ROLES, SIGNUP_STATUS } from "../constants/roles";
import { Mass, Signup } from "../types/types";

/**
 * Retorna o peso de uma função para ordenação
 */
export function getRoleWeight(role?: string | null): number {
    if (!role) return 5;
    const norm = role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (norm.includes("cerimonia")) return 1;
    if (norm.includes("librifer")) return 2;
    if (norm.includes("turifer")) return 3;
    if (norm.includes("navet")) return 4;
    if (norm.includes("auxiliar")) return 5;
    if (role === ROLES.LAVA_PES) return 6;
    if (role === ROLES.LEITURAS) return 7;
    if (role === ROLES.MATRACA) return 8;
    return 5; // AUXILIARY
}

/**
 * Calcula o número de vagas disponíveis em uma missa
 */
export function getAvailableSlots(mass: Mass): number {
    const confirmed = mass.signups.filter(
        (s: Signup) => (s as any).status !== SIGNUP_STATUS.RESERVE
    );
    return mass.maxServers - confirmed.length;
}

/**
 * Obtém o total de inscrições confirmadas
 */
export function getConfirmedCount(mass: Mass): number {
    return mass.signups.filter(
        (s: Signup) => (s as any).status !== SIGNUP_STATUS.RESERVE
    ).length;
}

/**
 * Verifica se a missa está lotada
 */
export function isMassFull(mass: Mass): boolean {
    return getAvailableSlots(mass) <= 0;
}

/**
 * Verifica se o usuário está inscrito em uma missa
 */
export function isUserSignedUp(mass: Mass, userId: string): boolean {
    return mass.signups.some((s) => s.userId === userId);
}

/**
 * Obtém a inscrição do usuário em uma missa
 */
export function getUserSignup(mass: Mass, userId: string): Signup | undefined {
    return mass.signups.find((s) => s.userId === userId);
}

/**
 * Verifica se a inscrição é uma reserva
 */
export function isReserveSignup(signup: Signup): boolean {
    return (signup as any).status === SIGNUP_STATUS.RESERVE;
}
