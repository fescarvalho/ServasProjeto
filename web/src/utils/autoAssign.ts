import { Mass, Signup, FUNCOES } from "../types/types";
import { getUserGender } from "../constants/roles";

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
        let minExec = metrics.roleFrequencies[bestRole] ?? 0;

        for (const role of allowedRoles) {
            const freq = metrics.roleFrequencies[role] ?? 0;
            if (freq < minExec) {
                minExec = freq;
                bestRole = role;
            }
        }

        signup.role = bestRole;
        signup.status = "CONFIRMADO";
        roleDistribution[bestRole] = (roleDistribution[bestRole] || 0) + 1;
    });

    return localSignups;
}
