import { prisma } from "../config/database";
import { buildShortNamesData, getActiveShortNamesData } from "./user.service";
import { getBrazilCurrentYearMonth, getPreviousMonth, resolveMonthlyWinner } from "./prize.service";

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

/**
 * Automatically post a notice for the monthly champion
 */
export async function postMonthlyChampionNotice() {
    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const prev = getPreviousMonth(curYear, curMonth);

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const previousMonthName = monthNames[prev.month];

    const existingNotice = await prisma.notice.findFirst({
        where: {
            text: { contains: `mês de ${previousMonthName}` }
        }
    });

    if (existingNotice && (existingNotice.text.includes("Serva Campeã") || existingNotice.text.includes("Destaque do mês"))) {
        return { success: false, message: "Notice already exists for the previous month." };
    }

    const resolution = await resolveMonthlyWinner(prev.year, prev.month);
    if (!resolution.winner) {
        return { success: false, message: "No presences found for the previous month." };
    }

    const shortNames = await getActiveShortNamesData();
    const championName =
        shortNames.byId[resolution.winner.userId] ||
        resolution.winner.name.trim().split(/\s+/)[0];

    const text = `🏆 Parabéns ${championName}! Você foi o Destaque do mês de ${previousMonthName} com ${resolution.winner.totalPresences} presenças e ${resolution.winner.score} pontos! Deus abençoe! 🏆`;

    await prisma.notice.create({
        data: { text, active: true }
    });

    return { success: true, message: `Champion notice created for ${previousMonthName}: ${championName}` };
}
