import { prisma } from "../config/database";
import { parseDateTime, parseDeadline } from "../utils/date.utils";

const PHOTO_DATA_PREFIX = "__MASS_PHOTO_DATA__:";
const PHOTO_META_PREFIX = "__MASS_PHOTO_META__:";
const PHOTO_RETENTION_DAYS = 7;
const PHOTO_RETENTION_MS = PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface MassPhotoMeta {
    uploadedById: string;
    uploadedByName: string;
    uploadedAt: string;
}

export interface MassPhotoPayload extends MassPhotoMeta {
    massId: string;
    imageDataUrl: string;
}

interface MassData {
    date: string;
    time: string;
    maxServers: number;
    name?: string;
    local?: string;
    deadline?: string;
    open?: boolean;
    isSolemnity?: boolean;
    points?: number;
}

async function getMassPhotoMetaIndex(): Promise<{ recordId: string | null; map: Record<string, MassPhotoMeta> }> {
    try {
        const record = await prisma.notice.findFirst({
            where: {
                active: false,
                text: { startsWith: PHOTO_META_PREFIX },
            },
            orderBy: { createdAt: "desc" },
        });
        if (!record) {
            return { recordId: null, map: {} };
        }
        const raw = record.text.slice(PHOTO_META_PREFIX.length);
        const parsed = JSON.parse(raw);
        return {
            recordId: record.id,
            map: parsed && typeof parsed === "object" ? parsed : {},
        };
    } catch (err) {
        console.error("[MassPhotoMeta] Erro ao ler índice de fotos:", err);
        return { recordId: null, map: {} };
    }
}

async function saveMassPhotoMetaIndex(map: Record<string, MassPhotoMeta>, existingId?: string | null): Promise<void> {
    const payload = PHOTO_META_PREFIX + JSON.stringify(map);
    if (existingId) {
        await prisma.notice.update({
            where: { id: existingId },
            data: { text: payload, active: false },
        });
        return;
    }

    const existing = await prisma.notice.findFirst({
        where: {
            active: false,
            text: { startsWith: PHOTO_META_PREFIX },
        },
        orderBy: { createdAt: "desc" },
    });

    if (existing) {
        await prisma.notice.update({
            where: { id: existing.id },
            data: { text: payload, active: false },
        });
    } else {
        await prisma.notice.create({
            data: { text: payload, active: false },
        });
    }
}

/**
 * Remove automaticamente fotos com mais de 7 dias e retorna o índice atualizado
 */
export async function cleanupExpiredMassPhotos(): Promise<Record<string, MassPhotoMeta>> {
    const cutoffDate = new Date(Date.now() - PHOTO_RETENTION_MS);

    try {
        await prisma.notice.deleteMany({
            where: {
                active: false,
                text: { startsWith: PHOTO_DATA_PREFIX },
                createdAt: { lt: cutoffDate },
            },
        });
    } catch (err) {
        console.error("[MassPhotoCleanup] Erro ao limpar fotos expiradas:", err);
    }

    const { recordId, map } = await getMassPhotoMetaIndex();
    let changed = false;
    const cutoffMs = cutoffDate.getTime();

    for (const [mId, meta] of Object.entries(map)) {
        const uploadedMs = meta?.uploadedAt ? new Date(meta.uploadedAt).getTime() : 0;
        if (!uploadedMs || isNaN(uploadedMs) || uploadedMs < cutoffMs) {
            delete map[mId];
            changed = true;
        }
    }

    if (changed) {
        try {
            await saveMassPhotoMetaIndex(map, recordId);
        } catch (err) {
            console.error("[MassPhotoCleanup] Erro ao atualizar índice após limpeza:", err);
        }
    }

    return map;
}

/**
 * Get all masses with signups (select only necessary user fields to reduce mobile data payload by ~60%)
 */
export async function getAllMasses() {
    const [masses, photoMetaMap] = await Promise.all([
        prisma.mass.findMany({
            include: {
                signups: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { date: "asc" },
        }),
        cleanupExpiredMassPhotos(),
    ]);

    return masses.map((m) => {
        const photoMeta = photoMetaMap[m.id];
        return {
            ...m,
            hasPhoto: Boolean(photoMeta),
            photoUploadedBy: photoMeta?.uploadedByName || null,
            photoUploadedAt: photoMeta?.uploadedAt || null,
        };
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
            points: (data.points !== undefined && data.points !== null) ? Number(data.points) : null,
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

    if (data.points !== undefined) {
        updateData.points = data.points === null ? null : Number(data.points);
    }

    return await prisma.mass.update({
        where: { id },
        data: updateData,
    });
}

/**
 * Delete a mass and all its signups (and its team photo if any)
 */
export async function deleteMass(id: string) {
    await Promise.all([
        prisma.signup.deleteMany({ where: { massId: id } }),
        deleteMassPhoto(id).catch(() => {}),
    ]);
    return await prisma.mass.delete({ where: { id } });
}

/**
 * Get team photo for a specific mass (returns null if expired > 30 days or not found)
 */
export async function getMassPhoto(massId: string): Promise<MassPhotoPayload | null> {
    await cleanupExpiredMassPhotos();

    const prefix = `${PHOTO_DATA_PREFIX}${massId}:`;
    const record = await prisma.notice.findFirst({
        where: {
            active: false,
            text: { startsWith: prefix },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!record) return null;

    const cutoffMs = Date.now() - PHOTO_RETENTION_MS;
    if (record.createdAt.getTime() < cutoffMs) {
        await deleteMassPhoto(massId).catch(() => {});
        return null;
    }

    try {
        const raw = record.text.slice(prefix.length);
        const parsed = JSON.parse(raw) as MassPhotoPayload;
        return parsed;
    } catch (err) {
        console.error("[MassPhoto] Erro ao decodificar foto:", err);
        return null;
    }
}

/**
 * Save or replace team photo for a mass (retains for 7 days)
 */
export async function saveMassPhoto(
    massId: string,
    userId: string,
    imageDataUrl: string,
    capturedAt?: string
): Promise<MassPhotoMeta> {
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
        throw new Error("Formato de imagem inválido. Envie uma foto válida.");
    }
    if (imageDataUrl.length > 3_500_000) {
        throw new Error("A imagem é muito grande. Tente novamente.");
    }

    const [mass, user] = await Promise.all([
        prisma.mass.findUnique({
            where: { id: massId },
            include: { signups: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true },
        }),
    ]);

    if (!mass) {
        throw new Error("Missa não encontrada.");
    }
    if (!user || user.role === "INATIVO") {
        throw new Error("Usuário inválido ou inativo.");
    }

    const isAdmin = user.role === "ADMIN";
    if (!isAdmin) {
        const mySignup = mass.signups.find((s) => s.userId === userId && s.status !== "RESERVA");
        if (!mySignup) {
            throw new Error("Apenas servos(as) escalados(as) nesta missa podem enviar a foto da equipe.");
        }

        // Janela permitida: mesmo dia da missa (fuso Brasil) ou de 4h antes até 24h após o horário da missa
        // Suporta horário capturado offline (até 7 dias atrás) para sincronizar quando voltar a internet
        const now = new Date();
        let checkTime = now;
        if (capturedAt) {
            const parsedCapture = new Date(capturedAt);
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (
                !isNaN(parsedCapture.getTime()) &&
                parsedCapture.getTime() <= now.getTime() + 5 * 60 * 1000 &&
                now.getTime() - parsedCapture.getTime() <= sevenDaysMs
            ) {
                checkTime = parsedCapture;
            }
        }

        const massDate = new Date(mass.date);
        const diffHours = (checkTime.getTime() - massDate.getTime()) / (1000 * 60 * 60);
        const checkBrDay = checkTime.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
        const massBrDay = massDate.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

        if (checkBrDay !== massBrDay && (diffHours < -4 || diffHours > 24)) {
            throw new Error("O envio da foto da equipe só fica disponível no dia da missa.");
        }
    }

    const uploadedAt = new Date().toISOString();
    const metaEntry: MassPhotoMeta = {
        uploadedById: user.id,
        uploadedByName: user.name,
        uploadedAt,
    };
    const fullPayload: MassPhotoPayload = {
        ...metaEntry,
        massId,
        imageDataUrl,
    };

    const prefix = `${PHOTO_DATA_PREFIX}${massId}:`;
    const serializedData = prefix + JSON.stringify(fullPayload);

    // Remove eventual foto anterior desta missa e cria novo registro com createdAt de agora (para contagem de 7 dias)
    await prisma.notice.deleteMany({
        where: {
            active: false,
            text: { startsWith: prefix },
        },
    });
    await prisma.notice.create({
        data: {
            text: serializedData,
            active: false,
        },
    });

    const currentMap = await cleanupExpiredMassPhotos();
    currentMap[massId] = metaEntry;
    await saveMassPhotoMetaIndex(currentMap);

    return metaEntry;
}

/**
 * Delete team photo of a mass
 */
export async function deleteMassPhoto(massId: string): Promise<void> {
    const prefix = `${PHOTO_DATA_PREFIX}${massId}:`;
    await prisma.notice.deleteMany({
        where: {
            active: false,
            text: { startsWith: prefix },
        },
    });

    const { recordId, map } = await getMassPhotoMetaIndex();
    if (map[massId]) {
        delete map[massId];
        await saveMassPhotoMetaIndex(map, recordId);
    }
}

/**
 * Mark all confirmed signups of a mass as present
 */
export async function confirmAllMassPresence(massId: string): Promise<{ count: number }> {
    const result = await prisma.signup.updateMany({
        where: {
            massId,
            status: "CONFIRMADO",
        },
        data: {
            present: true,
        },
    });
    return { count: result.count };
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

    if (updateData.points !== undefined) {
        updateData.points = updateData.points === null ? null : Number(updateData.points);
    }

    return await prisma.mass.update({
        where: { id },
        data: updateData,
    });
}
