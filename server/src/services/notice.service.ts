import { prisma } from "../config/database";

/**
 * Get all active notices
 */
export async function getActiveNotices() {
    return await prisma.notice.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });
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
