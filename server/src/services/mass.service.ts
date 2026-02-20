import { prisma } from "../config/database";
import { parseDateTime, parseDeadline } from "../utils/date.utils";
import { sendPushToAll } from "./push.service";

interface MassData {
    date: string;
    time: string;
    maxServers: number;
    name?: string;
    deadline?: string;
    open?: boolean;
}

/**
 * Get all masses with signups
 */
export async function getAllMasses() {
    return await prisma.mass.findMany({
        include: { signups: { include: { user: true } } },
        orderBy: { date: "asc" },
    });
}

/**
 * Create a new mass
 */
export async function createMass(data: MassData) {
    const dateTime = parseDateTime(data.date, data.time);
    const deadline = parseDeadline(data.deadline);

    return await prisma.mass.create({
        data: {
            date: dateTime,
            maxServers: Number(data.maxServers),
            name: data.name || null,
            deadline,
            published: false,
            open: Boolean(data.open),
        },
    });
}

/**
 * Update an existing mass
 */
export async function updateMass(id: string, data: Partial<MassData>) {
    const updateData: any = {};

    if (data.date && data.time) {
        updateData.date = parseDateTime(data.date, data.time);
    }

    if (data.maxServers !== undefined) {
        updateData.maxServers = Number(data.maxServers);
    }

    if (data.name !== undefined) {
        updateData.name = data.name || null;
    }

    if (data.deadline !== undefined) {
        updateData.deadline = parseDeadline(data.deadline);
    }

    if (data.open !== undefined) {
        updateData.open = Boolean(data.open);
    }

    return await prisma.mass.update({
        where: { id },
        data: updateData,
    });
}

/**
 * Delete a mass and all its signups
 */
export async function deleteMass(id: string) {
    await prisma.signup.deleteMany({ where: { massId: id } });
    return await prisma.mass.delete({ where: { id } });
}

/**
 * Toggle publish status of a mass
 */
export async function togglePublish(id: string, published: boolean) {
    const mass = await prisma.mass.update({
        where: { id },
        data: { published },
    });

    // When publishing, notify all subscribed users
    if (published) {
        const monthName = new Date(mass.date).toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
            timeZone: "America/Sao_Paulo",
        });
        sendPushToAll({
            title: "📅 Nova Escala Disponível",
            body: `A escala de ${monthName} acabou de ser liberada! Acesse o app para ver.`,
            url: "/",
        }).catch(console.error); // fire-and-forget, don't block the response
    }

    return mass;
}

/**
 * Toggle open status of a mass (allow/disallow signups)
 */
export async function toggleOpen(id: string, open: boolean) {
    return await prisma.mass.update({
        where: { id },
        data: { open },
    });
}

/**
 * Patch mass with arbitrary data
 */
export async function patchMass(id: string, data: any) {
    return await prisma.mass.update({
        where: { id },
        data,
    });
}
