import { Mass, Signup, FUNCOES } from "../types/types";

// Helper para calcular métricas do usuário no histórico
function getUserMetrics(userId: string, allMasses: Mass[]) {
    let totalParticipations = 0;
    const roleFrequencies: Record<string, number> = {
        "Cerimoniária": 0,
        "Librífera": 0,
        "Auxiliar": 0,
        "Lava-pés": 0,
        "Leituras": 0,
        "Matraca": 0,
    };

    for (const mass of allMasses) {
        const signup = mass.signups.find((s) => s.userId === userId);
        // Consideramos participação se a pessoa esteve confirmada na escala (status !== RESERVA)
        // Se a missa já passou, idealmente usaríamos present === true, mas para histórico geral consideramos que ela foi escalada.
        if (signup && signup.status !== "RESERVA") {
            totalParticipations++;
            if (signup.role && roleFrequencies[signup.role] !== undefined) {
                roleFrequencies[signup.role]++;
            }
        }
    }

    return { totalParticipations, roleFrequencies };
}

export function autoAssign(targetMass: Mass, allMasses: Mass[]): Signup[] {
    // Criar uma cópia profunda (deep copy) de signups para não mutar o objeto original
    const localSignups: Signup[] = JSON.parse(JSON.stringify(targetMass.signups));
    const maxServers = targetMass.maxServers;

    // 1. Identificar quem já possui função atribuída manualmente pelo Admin e garantir que estejam Confirmadas
    localSignups.forEach((signup) => {
        if (signup.role && FUNCOES.includes(signup.role)) {
            signup.status = "CONFIRMADO";
        }
    });

    // Quantas vagas ocupadas por designação manual?
    const manualCount = localSignups.filter((s) => s.status === "CONFIRMADO").length;
    let remainingSlots = Math.max(0, maxServers - manualCount);

    // 2. Extrair os "candidatos" (quem ainda não tem função/status definido manualmente ou está como Reserva sem função ou com função default)
    // Usado formatacao de variaveis

    // Consideramos que qualquer um não fixado pelo admin (status = Confirmado && Role Válida) é candidato se houver vagas.
    // Aguarde, se o Admin marcou "status = CONFIRMADO" mas sem função, ele também é candidato para VAGA e FUNÇÃO, 
    // mas já ocupa uma vaga (ou não? Se remainingSlots usa status === CONFIRMADO, ele já descontou a vaga).
    // Para simplificar, quem não tem `role` válida é candidato. Mas precisamos gerenciar o status.
    // Vamos resetar todos os não fixados para RESERVA primeiro para recalcular as vagas corretamente:
    localSignups.forEach((s) => {
        if (!s.role || !FUNCOES.includes(s.role)) {
            s.status = "RESERVA";
        }
    });

    const confirmedCount = localSignups.filter((s) => s.status === "CONFIRMADO").length;
    remainingSlots = Math.max(0, maxServers - confirmedCount);

    const availableCandidates = localSignups.filter((s) => s.status === "RESERVA");

    // Calcular métricas para os candidatos
    const candidatesMetrics = availableCandidates.map((signup) => {
        return {
            signup,
            metrics: getUserMetrics(signup.userId, allMasses),
        };
    });

    // Ordenar candidatos por:
    // - Menor número total de participações (Equidade)
    candidatesMetrics.sort((a, b) => a.metrics.totalParticipations - b.metrics.totalParticipations);

    // Selecionar os N primeiros candidatos para as vagas restantes
    const selectedCandidates = candidatesMetrics.slice(0, remainingSlots);

    // Distribuir funções entre os selecionados (Rodízio)
    // A distribuição ideal é balancear. Quantas de cada função precisamos?
    // Em geral, 1 Cerimoniária, 1-2 Libríferas, restantes Auxiliares, ou o Admin escolhe.
    // Como não há regra fixa de "quantas" cada missa exige, vamos iterar sobre as funções base.
    // De forma genérica: as funções menos executadas pela serva devem ter prioridade, mas precisamos preencher de forma não arbitrária?
    // A regra diz: "Em caso de empate, a serva que menos vezes executou a função que está a ser preenchida (Rodízio)."
    // Mas qual função está a ser preenchida? Vamos ordenar as funções por prioridade genérica: Cerimoniária, Librífera, Auxiliar.
    // Se não houver Cerimoniária fixa, tenta achar uma. Mas o sistema não força 1 Cerimoniária? Se não força,
    // vamos apenas dar a função que a serva MENOS fez.

    // Para evitar que todas peguem Auxiliar ou todas Cerimoniária, distribuímos de forma equilibrada pelas funções.
    // Funções preenchidas nesta missa (incluindo as manuais):
    const roleDistribution: Record<string, number> = {
        "Cerimoniária": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Cerimoniária").length,
        "Librífera": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Librífera").length,
        "Auxiliar": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Auxiliar").length,
        "Lava-pés": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Lava-pés").length,
        "Leituras": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Leituras").length,
        "Matraca": localSignups.filter((s) => s.status === "CONFIRMADO" && s.role === "Matraca").length,
    };

    selectedCandidates.forEach(({ signup, metrics }) => {
        // Definimos a próxima função a preencher como a que está com menos pessoas nesta missa?
        // Ou simplesmente damos a função que o candidato MENOS fez?
        // "Em caso de empate, a serva que menos vezes executou a função..."
        // Vamos balancear a missa atual.

        // Funções válidas para escolha respeitando as novas regras de prioridades:
        // 1. Cerimoniária é prioridade máxima. Se não houver ao menos 1, alguém tem que ser Cerimoniária.
        // 2. Se a Cerimoniária já estiver preenchida (>= 1), a prioridade passa para Librífera. 
        //    Não há necessidade de ter muitas Libríferas se a missa for gigante, mas a regra é "Caso 2 servas: Ceri/Libr."
        //    Então, se Librífera < 2 (ou < 1, dependendo do gosto, vamos deixar que se tente ter pelo menos 1-2 Libríferas antes de Auxiliar).
        // 3. Auxiliar só entra se as outras duas já tiverem representação mínima.

        // Lista dinâmica de "cargos passíveis de serem escolhidos neste momento"
        let allowedRoles: string[] = [];

        if (roleDistribution["Cerimoniária"] < 1) {
            allowedRoles.push("Cerimoniária");
        }
        if (roleDistribution["Librífera"] < 1) {
            allowedRoles.push("Librífera");
        }

        // Se Cerimoniária e Librífera já estiverem preenchidas (>= 1), a única vaga disponível é Auxiliar.
        if (allowedRoles.length === 0) {
            allowedRoles = ["Auxiliar"];
        }

        // Dos cargos permitidos, ordenar pela menor distribuição atual na missa para tentar equilibrar (opcional)
        // Mas a prioridade do usuário é o *Rodízio* do histórico.
        // Então, de "allowedRoles", pegar o que o usuário menos vezes fez.

        let bestRole = allowedRoles[0];
        let minExec = metrics.roleFrequencies[bestRole];

        for (const role of allowedRoles) {
            if (metrics.roleFrequencies[role] < minExec) {
                minExec = metrics.roleFrequencies[role];
                bestRole = role;
            }
        }

        signup.role = bestRole;
        signup.status = "CONFIRMADO";
        roleDistribution[bestRole]++;
    });

    return localSignups;
}
