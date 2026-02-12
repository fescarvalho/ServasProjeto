import { prisma } from "../config/database";

/**
 * Get all users (id and name only)
 */
export async function getUsersList() {
    return await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}
