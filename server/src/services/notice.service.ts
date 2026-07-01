import { prisma } from "../config/database";

/**
 * Get all active notices
 */
export async function getActiveNotices() {
    const notices = await prisma.notice.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });

    const todayBrazilStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const today = new Date(todayBrazilStr);
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const usersWithBirthday = await prisma.user.findMany({
        where: { birthDate: { not: null } }
    });

    const birthdayGirls = usersWithBirthday.filter((u) => {
        if (!u.birthDate) return false;
        return (
            u.birthDate.getUTCMonth() + 1 === currentMonth &&
            u.birthDate.getUTCDate() === currentDay
        );
    });

    if (birthdayGirls.length > 0) {
        const names = birthdayGirls.map(u => u.name.split(" ")[0]).join(" e ");
        const prefix = birthdayGirls.length > 1 ? "Hoje é aniversário das nossas servas" : "Hoje é aniversário da nossa serva";
        const birthdayNotice = {
            id: "birthday-notice-auto",
            text: `🎉 ${prefix} ${names}! Parabéns e que Deus abençoe muito a sua vida! 🎉`,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        notices.unshift(birthdayNotice as any);
    }

    return notices;
}

/**
 * Create a new notice
 */
export async function createNotice(text: string) {
    return await prisma.notice.create({
        data: { text, active: true },
    });
}

/**
 * Delete a notice
 */
export async function deleteNotice(id: string) {
    return await prisma.notice.delete({ where: { id } });
}

function getMassPoints(dateString: string | Date, manualPoints?: number | null) {
    if (manualPoints !== undefined && manualPoints !== null) return manualPoints;
    
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

/**
 * Automatically post a notice for the monthly champion
 */
export async function postMonthlyChampionNotice() {
    const today = new Date();
    // Get first day of the current month
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Get last day of previous month
    const lastDayPreviousMonth = new Date(firstDayCurrentMonth.getTime() - 1);
    // Get first day of previous month
    const firstDayPreviousMonth = new Date(lastDayPreviousMonth.getFullYear(), lastDayPreviousMonth.getMonth(), 1);

    // Month name in pt-BR
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const previousMonthName = monthNames[lastDayPreviousMonth.getMonth()];

    // Check if notice already exists
    const existingNotice = await prisma.notice.findFirst({
        where: {
            text: { contains: `mês de ${previousMonthName}` }
        }
    });

    if (existingNotice && existingNotice.text.includes("Serva Campeã")) {
        return { success: false, message: "Notice already exists for the previous month." };
    }

    const masses = await prisma.mass.findMany({
        where: {
            date: {
                gte: firstDayPreviousMonth,
                lte: lastDayPreviousMonth
            }
        },
        include: {
            signups: {
                include: { user: true }
            }
        }
    });

    const scores: Record<string, { count: number; score: number; absences: number; name: string }> = {};

    masses.forEach(mass => {
        const points = getMassPoints(mass.date, (mass as any).points);

        mass.signups.forEach(signup => {
            const userId = signup.user?.id;
            const userName = signup.user?.name || "Serva Desconhecida";
            if (userId) {
                if (!scores[userId]) {
                    scores[userId] = { count: 0, score: 0, absences: 0, name: userName };
                }
                if (signup.present) {
                    scores[userId].count += 1;
                    scores[userId].score += points;
                } else {
                    scores[userId].absences += 1;
                }
            }
        });
    });

    const ranking = Object.values(scores)
        // Somente quem teve alguma pontuação/presença deve participar (remover quem só teve faltas)
        .filter(s => s.count > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.count !== a.count) return b.count - a.count;
            return a.absences - b.absences;
        });

    if (ranking.length === 0) {
        return { success: false, message: "No presences found for the previous month." };
    }

    const championScore = ranking[0].score;
    const championCount = ranking[0].count;
    const championAbsences = ranking[0].absences;
    
    const champions = ranking.filter(r => r.score === championScore && r.count === championCount && r.absences === championAbsences);
    const championNames = champions.map(c => c.name.split(" ")[0]).join(" e ");
    
    const text = `🏆 Parabéns ${championNames}! ${champions.length > 1 ? 'Vocês foram as Servas Campeãs' : 'Você foi a Serva Campeã'} do mês de ${previousMonthName} com ${championCount} presenças e ${championScore} pontos! Deus abençoe! 🏆`;

    await prisma.notice.create({
        data: { text, active: true }
    });

    return { success: true, message: `Champion notice created for ${previousMonthName}: ${championNames}` };
}
