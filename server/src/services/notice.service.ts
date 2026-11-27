import { prisma } from "../config/database";
import { buildShortNamesData, getActiveShortNamesData } from "./user.service";

function formatNameList(names: string[]): string {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function computeAge(birthDate: Date, today: Date): number | null {
    const birthYear = birthDate.getUTCFullYear();
    const age = today.getFullYear() - birthYear;
    return age > 0 && age < 120 ? age : null;
}

/**
 * Get all active notices
 */
export async function getActiveNotices() {
    const [notices, activeUsers] = await Promise.all([
        prisma.notice.findMany({
            where: { active: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
            where: { role: { notIn: ["INATIVO", "ADMIN"] } },
            select: { id: true, name: true, email: true, birthDate: true },
        }),
    ]);

    const shortNames = buildShortNamesData(
        activeUsers.filter(
            (u) => !["teste@servas.com", "formacao@serva.com", "formacao2026@servos.com"].includes(u.email)
        )
    );

    const todayBrazilStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const today = new Date(todayBrazilStr);
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayUsers = activeUsers
        .filter((u) => {
            if (!u.birthDate) return false;
            return (
                u.birthDate.getUTCMonth() + 1 === currentMonth &&
                u.birthDate.getUTCDate() === currentDay
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

    if (birthdayUsers.length > 0) {
        const birthdayPeople = birthdayUsers.map((u) => {
            const full = u.name.trim();
            const short = shortNames.byId[u.id] || full.split(/\s+/)[0];
            return {
                id: u.id,
                name: short,
                fullName: full,
                age: u.birthDate ? computeAge(u.birthDate, today) : null,
            };
        });
        const formattedNames = formatNameList(birthdayPeople.map((p) => p.name));
        const blessing =
            birthdayPeople.length > 1
                ? "Parabéns e que Deus abençoe muito as suas vidas e o serviço no Altar!"
                : "Parabéns e que Deus abençoe muito a sua vida e o seu serviço no Altar!";
        const birthdayNotice = {
            id: "birthday-notice-auto",
            text: `🎂 Hoje celebramos o aniversário de ${formattedNames}! ${blessing} 🎉`,
            active: true,
            isBirthday: true,
            birthdayPeople,
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

function getMassPoints(dateInput: string | Date, manualPoints?: number | null) {
    if (manualPoints !== undefined && manualPoints !== null) return manualPoints;

    const normalized =
        typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
            ? `${dateInput}T12:00:00`
            : dateInput;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return 1;

    const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    // Domingo (0) = 1 ponto; Dias de semana (1 a 6) = 2 pontos
    return brDate.getDay() === 0 ? 1 : 2;
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

    if (existingNotice && (existingNotice.text.includes("Serva Campeã") || existingNotice.text.includes("Destaque do mês"))) {
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

    const scores: Record<string, { id: string; count: number; score: number; absences: number; name: string }> = {};

    masses.forEach(mass => {
        const points = getMassPoints(mass.date, (mass as any).points);

        mass.signups.forEach(signup => {
            const userId = signup.user?.id;
            const userName = signup.user?.name || "Serva Desconhecida";
            if (userId) {
                if (!scores[userId]) {
                    scores[userId] = { id: userId, count: 0, score: 0, absences: 0, name: userName };
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
    
    const shortNames = await getActiveShortNamesData();
    const champions = ranking.filter(r => r.score === championScore && r.count === championCount && r.absences === championAbsences);
    const championNames = formatNameList(
        champions.map(c => shortNames.byId[c.id] || c.name.trim().split(/\s+/)[0])
    );
    
    const text = `🏆 Parabéns ${championNames}! ${champions.length > 1 ? 'Vocês foram os Destaques do mês' : 'Você foi o Destaque do mês'} de ${previousMonthName} com ${championCount} presenças e ${championScore} pontos! Deus abençoe! 🏆`;

    await prisma.notice.create({
        data: { text, active: true }
    });

    return { success: true, message: `Champion notice created for ${previousMonthName}: ${championNames}` };
}
