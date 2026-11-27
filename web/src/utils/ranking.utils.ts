import { Mass } from "../types/types";

// --- LÓGICA DE PONTUAÇÃO ---
export function getMassPoints(dateString: string) {
    if (!dateString) return 1;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? `${dateString}T12:00:00` : dateString;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return 1;

    const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    // Domingo (0) = 1 ponto; Dias de semana (1 a 6) = 2 pontos
    return brDate.getDay() === 0 ? 1 : 2;
}

export interface ServaRanking {
    id: string;
    name: string;
    score: number;
    countSpecial: number; // Semana, Dom 10h (2pts) ou Semana Santa (3pts)
    countNormal: number; // Outras (1pt)
    absences?: number;
}

export function calculateRanking(masses: Mass[], month: number, year: number): ServaRanking[] {
    const stats: Record<string, ServaRanking> = {};
    const now = new Date();

    const filteredMasses = masses.filter((m) => {
        const d = new Date(m.date);
        const brDate = new Date(
            d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
        );
        return brDate.getMonth() === month && brDate.getFullYear() === year;
    });

    filteredMasses.forEach((mass) => {
        const isPast = new Date(mass.date) < now;
        // Usa a pontuação manual se existir, senão usa a lógica automática
        const points = (mass.points !== undefined && mass.points !== null) ? mass.points : getMassPoints(mass.date);

        mass.signups.forEach((signup) => {
            if ((signup as any).status === "RESERVA") return;
            if (signup.present) {
                if (!stats[signup.userId]) {
                    stats[signup.userId] = {
                        id: signup.userId,
                        name: signup.user.name,
                        score: 0,
                        countSpecial: 0,
                        countNormal: 0,
                        absences: 0,
                    };
                }

                // Soma Pontos Totais
                stats[signup.userId].score += points;

                // Separa a contagem para exibir detalhes
                // Agora "Special" inclui missas de 2 ou 3 pontos (Semana Santa)
                if (points >= 2) {
                    stats[signup.userId].countSpecial += 1;
                } else {
                    stats[signup.userId].countNormal += 1;
                }
            } else if (isPast) {
                if (!stats[signup.userId]) {
                    stats[signup.userId] = {
                        id: signup.userId,
                        name: signup.user.name,
                        score: 0,
                        countSpecial: 0,
                        countNormal: 0,
                        absences: 0,
                    };
                }
                stats[signup.userId].absences = (stats[signup.userId].absences || 0) + 1;
            }
        });
    });

    return Object.values(stats)
        .filter((s) => s.score > 0 && s.countSpecial + s.countNormal > 0)
        .sort((a, b) => {
            // 1º Critério: Pontuação Total
            if (b.score !== a.score) return b.score - a.score;

            // 2º Critério: Mais Escalas Totais (Presenças)
            const totalA = a.countSpecial + a.countNormal;
            const totalB = b.countSpecial + b.countNormal;
            if (totalB !== totalA) return totalB - totalA;

            // 3º Critério: Mais Escalas de 2+ pontos
            if (b.countSpecial !== a.countSpecial) return b.countSpecial - a.countSpecial;

            // 4º Critério: Menos Faltas no mês
            const absA = a.absences || 0;
            const absB = b.absences || 0;
            if (absA !== absB) return absA - absB;

            // 5º Critério: Ordem Alfabética
            return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
        });
}
