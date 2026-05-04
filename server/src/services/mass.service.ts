import { prisma } from "../config/database";
import { parseDateTime, parseDeadline } from "../utils/date.utils";

interface MassData {
    date: string;
    time: string;
    maxServers: number;
    name?: string;
    local?: string;
    deadline?: string;
    open?: boolean;
    isSolemnity?: boolean;
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
            local: data.local || null,
            deadline,
            published: false,
            open: Boolean(data.open),
            isSolemnity: Boolean(data.isSolemnity),
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

    if (data.local !== undefined) {
        updateData.local = data.local || null;
    }

    if (data.deadline !== undefined) {
        updateData.deadline = parseDeadline(data.deadline);
    }

    if (data.open !== undefined) {
        updateData.open = Boolean(data.open);
    }

    if (data.isSolemnity !== undefined) {
        updateData.isSolemnity = Boolean(data.isSolemnity);
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

    // (As Notificações In-App/Whatsapp substituem os Pushs de segundo plano aqui)

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
    const updateData = { ...data };

    if (updateData.date && updateData.time) {
        updateData.date = parseDateTime(updateData.date, updateData.time);
        delete updateData.time;
    }

    if (updateData.maxServers !== undefined) {
        updateData.maxServers = Number(updateData.maxServers);
    }

    if (updateData.local !== undefined) {
        updateData.local = updateData.local || null;
    }

    if (updateData.deadline !== undefined) {
        updateData.deadline = parseDeadline(updateData.deadline);
    }

    if (updateData.open !== undefined) {
        updateData.open = Boolean(updateData.open);
    }

    if (updateData.isSolemnity !== undefined) {
        updateData.isSolemnity = Boolean(updateData.isSolemnity);
    }

    return await prisma.mass.update({
        where: { id },
        data: updateData,
    });
}
