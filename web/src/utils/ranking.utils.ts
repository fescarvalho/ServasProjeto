import { Mass } from "../types/types";

// --- LÓGICA DE PONTUAÇÃO ---
export function getMassPoints(dateString: string) {
    const date = new Date(dateString);
    const brazilDateString = date.toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo",
    });
    const brazilDate = new Date(brazilDateString);

    const day = brazilDate.getDay();
    const hour = brazilDate.getHours();

    // --- SEMANA SANTA 2026 (29/03 a 05/04) = 3 PONTOS ---
    const year = brazilDate.getFullYear();
    const month = brazilDate.getMonth() + 1; // 0-indexed
    const monthDay = brazilDate.getDate();

    if (year === 2026) {
        // Março 29 a Abril 05
        if ((month === 3 && monthDay >= 29) || (month === 4 && monthDay <= 5)) {
            return 3;
        }
    }

    // 1. Semana (Segunda a Sexta) = 2 PONTOS
    if (day >= 1 && day <= 5) return 2;

    // 2. Domingo entre 9h e 11h = 2 PONTOS
    if (day === 0 && hour >= 9 && hour <= 11) return 2;

    // 3. Resto = 1 PONTO
    return 1;
}

export interface ServaRanking {
    id: string;
    name: string;
    score: number;
    countSpecial: number; // Semana ou Dom 10h (2pts)
    countNormal: number; // Outras (1pt)
}

export function calculateRanking(masses: Mass[], month: number, year: number): ServaRanking[] {
    const stats: Record<string, ServaRanking> = {};

    const filteredMasses = masses.filter((m) => {
        const d = new Date(m.date);
        const brDate = new Date(
            d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
        );
        return brDate.getMonth() === month && brDate.getFullYear() === year;
    });

    filteredMasses.forEach((mass) => {
        const points = getMassPoints(mass.date);

        mass.signups.forEach((signup) => {
            if (signup.present) {
                if (!stats[signup.userId]) {
                    stats[signup.userId] = {
                        id: signup.userId,
                        name: signup.user.name,
                        score: 0,
                        countSpecial: 0,
                        countNormal: 0,
                    };
                }

                // Soma Pontos Totais
                stats[signup.userId].score += points;

                // Separa a contagem para exibir detalhes
                if (points === 2) {
                    stats[signup.userId].countSpecial += 1;
                } else {
                    stats[signup.userId].countNormal += 1;
                }
            }
        });
    });

    return Object.values(stats).sort((a, b) => b.score - a.score);
}
