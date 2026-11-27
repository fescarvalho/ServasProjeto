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

// ── FORMATAÇÃO INTELIGENTE DE NOMES (1º NOME + DESAMBIGUAÇÃO QUANDO REPETIDO) ──

const NAME_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e"]);
const SHORT_NAMES_STORAGE_KEY = "servas_short_names_cache_v1";

function normalizeNameToken(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function buildShortNamesData(users: { id: string; name: string }[]): {
    byId: Record<string, string>;
    byFullName: Record<string, string>;
} {
    const entries = users
        .filter((u) => u && u.id && u.name && u.name.trim())
        .map((u) => {
            const trimmed = u.name.trim();
            const rawParts = trimmed.split(/\s+/);
            const sigParts = rawParts.filter(
                (w, idx) => idx === 0 || !NAME_PARTICLES.has(normalizeNameToken(w))
            );
            return {
                id: u.id,
                fullName: trimmed,
                normFull: normalizeNameToken(trimmed),
                sigParts: sigParts.length > 0 ? sigParts : rawParts,
                depth: 1,
            };
        });

    let changed = true;
    while (changed) {
        changed = false;
        const groups = new Map<string, typeof entries>();

        for (const entry of entries) {
            const label = entry.sigParts.slice(0, entry.depth).join(" ");
            const key = normalizeNameToken(label);
            const bucket = groups.get(key);
            if (bucket) {
                bucket.push(entry);
            } else {
                groups.set(key, [entry]);
            }
        }

        for (const bucket of groups.values()) {
            const distinctIds = new Set(bucket.map((b) => b.id));
            if (distinctIds.size > 1) {
                for (const item of bucket) {
                    if (item.depth < item.sigParts.length) {
                        item.depth += 1;
                        changed = true;
                    }
                }
            }
        }
    }

    const byId: Record<string, string> = {};
    const byFullName: Record<string, string> = {};
    for (const entry of entries) {
        const shortLabel = entry.sigParts.slice(0, entry.depth).join(" ");
        byId[entry.id] = shortLabel;
        if (entry.normFull) {
            byFullName[entry.normFull] = shortLabel;
        }
    }

    return { byId, byFullName };
}

let globalShortById: Record<string, string> = {};
let globalShortByFull: Record<string, string> = {};
let hasAuthoritativeServerMap = false;

try {
    if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(SHORT_NAMES_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.byId) globalShortById = parsed.byId;
            if (parsed?.byFullName) globalShortByFull = parsed.byFullName;
        }
    }
} catch {
    // ignore storage errors
}

export function setGlobalShortNames(
    byId?: Record<string, string>,
    byFullName?: Record<string, string>
): void {
    if (byId && Object.keys(byId).length > 0) {
        globalShortById = { ...globalShortById, ...byId };
        hasAuthoritativeServerMap = true;
    }
    if (byFullName && Object.keys(byFullName).length > 0) {
        globalShortByFull = { ...globalShortByFull, ...byFullName };
    }
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(
                SHORT_NAMES_STORAGE_KEY,
                JSON.stringify({ byId: globalShortById, byFullName: globalShortByFull })
            );
        }
    } catch {
        // ignore storage errors
    }
}

/**
 * Fallback local usando os inscritos das missas caso o cache de /users/metadata ainda não tenha carregado
 */
export function registerUsersFromMasses(
    masses: Mass[],
    extraUsers?: { id: string; name: string }[]
): void {
    if (hasAuthoritativeServerMap) return;
    const seen = new Map<string, { id: string; name: string }>();
    for (const m of masses || []) {
        for (const s of m.signups || []) {
            if (s.userId && s.user?.name) {
                seen.set(s.userId, { id: s.userId, name: s.user.name });
            }
        }
    }
    for (const u of extraUsers || []) {
        if (u?.id && u?.name) {
            seen.set(u.id, { id: u.id, name: u.name });
        }
    }
    if (seen.size > 0) {
        const computed = buildShortNamesData(Array.from(seen.values()));
        globalShortById = { ...computed.byId, ...globalShortById };
        globalShortByFull = { ...computed.byFullName, ...globalShortByFull };
    }
}

/**
 * Formata o nome de um(a) servo(a) fora do painel Admin:
 * - 1º nome por padrão;
 * - Com sobrenome/2º nome quando houver homônimos no grupo.
 */
export function formatServoName(fullName?: string | null, userId?: string | null): string {
    if (userId && globalShortById[userId]) {
        return globalShortById[userId];
    }
    const trimmed = (fullName || "").trim();
    if (!trimmed) return "";

    const norm = normalizeNameToken(trimmed);
    if (norm && globalShortByFull[norm]) {
        return globalShortByFull[norm];
    }

    return trimmed.split(/\s+/)[0];
}
