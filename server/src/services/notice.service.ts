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
