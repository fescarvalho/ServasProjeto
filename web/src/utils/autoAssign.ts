import { Mass, Signup, FUNCOES } from "../types/types";
import { getUserGender } from "../constants/roles";

export interface RoleStreakInfo {
    count: number;
    previousCount: number;
    role: string;
    massDates: string[];
}

/**
 * Calcula quantas escalas SEGUIDAS (consecutivas) a serva fica na mesma função
 * ao receber `candidateRole` na missa `targetMassId` (`targetMassDate`).
 */
export function getConsecutiveRoleStreak(
    userId: string,
    targetMassId: string,
    targetMassDate: string,
    candidateRole: string | null | undefined,
    allMasses: Mass[]
): RoleStreakInfo {
    const roleToCheck = (candidateRole || "Auxiliar").trim();
    const nowMs = Date.now();

    interface Entry {
        id: string;
        dateMs: number;
        dateIso: string;
        role: string;
        isTarget: boolean;
    }

    const entries: Entry[] = [];

    for (const m of allMasses) {
        if (m.id === targetMassId) continue;
        if (m.name?.includes("Ajuste de Pontos")) continue;

        const s = m.signups.find((sig) => sig.userId === userId && sig.status !== "RESERVA");
        if (!s) continue;

        const mDateMs = new Date(m.date).getTime();
        // Considera missas onde a função já foi atribuída, ou missas já publicadas/passadas (onde null = Auxiliar)
        const hasAssignedOrPublishedRole = Boolean(s.role) || m.published || mDateMs <= nowMs;
        if (!hasAssignedOrPublishedRole) continue;

        entries.push({
            id: m.id,
            dateMs: mDateMs,
            dateIso: m.date,
            role: (s.role || "Auxiliar").trim(),
            isTarget: false,
        });
    }

    const targetDateMs = new Date(targetMassDate).getTime();
    entries.push({
        id: targetMassId,
        dateMs: isNaN(targetDateMs) ? nowMs : targetDateMs,
        dateIso: targetMassDate,
        role: roleToCheck,
        isTarget: true,
    });

    entries.sort((a, b) => {
        if (a.dateMs !== b.dateMs) return a.dateMs - b.dateMs;
        if (a.isTarget) return 1;
        if (b.isTarget) return -1;
        return a.id.localeCompare(b.id);
    });

    const targetIdx = entries.findIndex((e) => e.isTarget);
    const prevMatches: Entry[] = [];
    for (let i = targetIdx - 1; i >= 0; i--) {
        if (entries[i].role === roleToCheck) {
            prevMatches.push(entries[i]);
        } else {
            break;
        }
    }

    const nextMatches: Entry[] = [];
    for (let i = targetIdx + 1; i < entries.length; i++) {
        if (entries[i].role === roleToCheck) {
            nextMatches.push(entries[i]);
        } else {
            break;
        }
    }

    const streakEntries = [...prevMatches.reverse(), entries[targetIdx], ...nextMatches];

    return {
        count: streakEntries.length,
        previousCount: prevMatches.length,
        role: roleToCheck,
        massDates: streakEntries.map((e) =>
            new Date(e.dateIso).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
            })
        ),
    };
}

/**
 * Verifica se a serva já vem de 2 ou mais escalas seguidas na mesma função
 * imediatamente antes da data da missa alvo.
 */
export function getLastConsecutiveRole(
    userId: string,
    beforeDateIso: string,
    allMasses: Mass[],
    excludeMassId?: string
): { role: string; count: number; dates: string[] } | null {
    const targetMs = new Date(beforeDateIso).getTime();
    const nowMs = Date.now();

    const userHistory = allMasses
        .filter((m) => {
            if (excludeMassId && m.id === excludeMassId) return false;
            if (m.name?.includes("Ajuste de Pontos")) return false;
            const mMs = new Date(m.date).getTime();
            if (!isNaN(targetMs) && mMs > targetMs) return false;
            const s = m.signups.find((sig) => sig.userId === userId && sig.status !== "RESERVA");
            if (!s) return false;
            return Boolean(s.role) || m.published || mMs <= nowMs;
        })
        .map((m) => {
            const s = m.signups.find((sig) => sig.userId === userId && sig.status !== "RESERVA")!;
            return {
                dateMs: new Date(m.date).getTime(),
                dateIso: m.date,
                role: (s.role || "Auxiliar").trim(),
            };
        })
        .sort((a, b) => a.dateMs - b.dateMs);

    if (userHistory.length < 2) return null;

    const lastEntry = userHistory[userHistory.length - 1];
    const matched = [lastEntry];

    for (let i = userHistory.length - 2; i >= 0; i--) {
        if (userHistory[i].role === lastEntry.role) {
            matched.push(userHistory[i]);
        } else {
            break;
        }
    }

    if (matched.length < 2) return null;

    const ordered = matched.reverse();
    return {
        role: lastEntry.role,
        count: ordered.length,
        dates: ordered.map((e) =>
            new Date(e.dateIso).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                day: "2-digit",
                month: "2-digit",
            })
        ),
    };
}

// Helper para calcular métricas do usuário no histórico
function getUserMetrics(userId: string, allMasses: Mass[]) {
    let totalParticipations = 0;
    const roleFrequencies: Record<string, number> = {
        "Cerimoniária": 0,
        "Librífera": 0,
        "Turiferário": 0,
        "Naveteiro": 0,
        "Auxiliar": 0,
        "Lava-pés": 0,
        "Leituras": 0,
        "Matraca": 0,
    };

    for (const mass of allMasses) {
        const signup = mass.signups.find((s) => s.userId === userId);
        if (signup && signup.status !== "RESERVA") {
            totalParticipations++;
            if (signup.role && roleFrequencies[signup.role] !== undefined) {
                roleFrequencies[signup.role]++;
            }
        }
    }

    return { totalParticipations, roleFrequencies };
}

/**
 * Gera a escala automática distribuindo funções por equidade e rodízio,
 * respeitando a lista de usuários indisponíveis na data da missa e
 * garantindo que Turiferário seja atribuído exclusivamente a meninos (M).
 */
export function autoAssign(
    targetMass: Mass,
    allMasses: Mass[],
    unavailableUserIds: string[] = []
): Signup[] {
    const localSignups: Signup[] = JSON.parse(JSON.stringify(targetMass.signups));
    const maxServers = targetMass.maxServers;
    const unavailableSet = new Set(unavailableUserIds);

    // 1. Quem já tem função atribuída manualmente pelo Admin permanece CONFIRMADO,
    // a menos que esteja marcado como indisponível na data
    localSignups.forEach((signup) => {
        if (unavailableSet.has(signup.userId)) {
            signup.status = "RESERVA";
            signup.role = null;
        } else if (signup.role && FUNCOES.includes(signup.role)) {
            signup.status = "CONFIRMADO";
        } else {
            signup.status = "RESERVA";
        }
    });

    const confirmedCount = localSignups.filter((s) => s.status === "CONFIRMADO").length;
    const remainingSlots = Math.max(0, maxServers - confirmedCount);

    // 2. Filtra apenas candidatos disponíveis na data
    const availableCandidates = localSignups.filter(
        (s) => s.status === "RESERVA" && !unavailableSet.has(s.userId)
    );

    const candidatesMetrics = availableCandidates.map((signup) => ({
        signup,
        metrics: getUserMetrics(signup.userId, allMasses),
    }));

    // Ordenar candidatos por menor número total de participações (Equidade)
    candidatesMetrics.sort((a, b) => a.metrics.totalParticipations - b.metrics.totalParticipations);

    const selectedCandidates = candidatesMetrics.slice(0, remainingSlots);

    const roleDistribution: Record<string, number> = {
        "Cerimoniária": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Cerimoniária").length,
        "Librífera": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Librífera").length,
        "Turiferário": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Turiferário").length,
        "Naveteiro": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Naveteiro").length,
        "Auxiliar": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Auxiliar").length,
        "Lava-pés": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Lava-pés").length,
        "Leituras": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Leituras").length,
        "Matraca": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Matraca").length,
    };

    selectedCandidates.forEach(({ signup, metrics }) => {
        let allowedRoles: string[] = [];
        const isMale = getUserGender(signup.userId, signup.user?.name) === "M";

        if (roleDistribution["Cerimoniária"] < 1) {
            allowedRoles.push("Cerimoniária");
        }
        if (roleDistribution["Librífera"] < 1) {
            allowedRoles.push("Librífera");
        }

        // Em Solenidades com mais vagas, inclui Turiferário (apenas para homens) e Naveteiro
        if (targetMass.isSolemnity && maxServers >= 4 && allowedRoles.length === 0) {
            if (isMale && roleDistribution["Turiferário"] < 1) {
                allowedRoles.push("Turiferário");
            }
            if (roleDistribution["Naveteiro"] < 1) {
                allowedRoles.push("Naveteiro");
            }
        }

        if (allowedRoles.length === 0) {
            allowedRoles = ["Auxiliar"];
        }

        let bestRole = allowedRoles[0];
        let minScore = Infinity;

        for (const role of allowedRoles) {
            const freq = metrics.roleFrequencies[role] ?? 0;
            const streak = getConsecutiveRoleStreak(signup.userId, targetMass.id, targetMass.date, role, allMasses);
            // Penaliza fortemente se a função gerar 3 ou mais escalas seguidas na mesma função
            const streakPenalty = streak.count >= 3 ? 1000 : 0;
            const score = freq + streakPenalty;
            if (score < minScore) {
                minScore = score;
                bestRole = role;
            }
        }

        signup.role = bestRole;
        signup.status = "CONFIRMADO";
        roleDistribution[bestRole] = (roleDistribution[bestRole] || 0) + 1;
    });

    return localSignups;
}
