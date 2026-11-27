import { prisma } from "../config/database";
import bcrypt from "bcryptjs";

const META_PREFIX = "__SYS_USER_META__:";

const NAME_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e"]);

export function normalizeNameToken(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Calcula o nome curto de exibição para cada servo(a):
 * - Apenas o 1º nome quando for único no grupo;
 * - Quando houver nomes iguais (ex: dois "Thiago", dois "João", duas "Maria Clara"),
 *   adiciona o próximo nome/sobrenome significativo até diferenciar todos.
 */
export function buildShortNamesData(users: { id: string; name: string }[]): {
    byId: Record<string, string>;
    byFullName: Record<string, string>;
} {
    const entries = users
        .filter((u) => u && u.id && u.name && u.name.trim())
        .map((u) => {
            const trimmed = u.name.trim();
            const rawParts = trimmed.split(/\s+/);
            const sigParts = rawParts.filter(
                (w, idx) => idx === 0 || !NAME_PARTICLES.has(normalizeNameToken(w))
            );
            return {
                id: u.id,
                fullName: trimmed,
                normFull: normalizeNameToken(trimmed),
                sigParts: sigParts.length > 0 ? sigParts : rawParts,
                depth: 1,
            };
        });

    let changed = true;
    while (changed) {
        changed = false;
        const groups = new Map<string, typeof entries>();

        for (const entry of entries) {
            const label = entry.sigParts.slice(0, entry.depth).join(" ");
            const key = normalizeNameToken(label);
            const bucket = groups.get(key);
            if (bucket) {
                bucket.push(entry);
            } else {
                groups.set(key, [entry]);
            }
        }

        for (const bucket of groups.values()) {
            // Só há colisão real se forem pessoas distintas (nomes completos distintos ou IDs distintos com mais partes)
            const distinctIds = new Set(bucket.map((b) => b.id));
            if (distinctIds.size > 1) {
                for (const item of bucket) {
                    if (item.depth < item.sigParts.length) {
                        item.depth += 1;
                        changed = true;
                    }
                }
            }
        }
    }

    const byId: Record<string, string> = {};
    const byFullName: Record<string, string> = {};
    for (const entry of entries) {
        const shortLabel = entry.sigParts.slice(0, entry.depth).join(" ");
        byId[entry.id] = shortLabel;
        if (entry.normFull) {
            byFullName[entry.normFull] = shortLabel;
        }
    }

    return { byId, byFullName };
}

export async function getActiveShortNamesData(): Promise<{
    byId: Record<string, string>;
    byFullName: Record<string, string>;
}> {
    const activeUsers = await prisma.user.findMany({
        where: {
            role: { notIn: ["INATIVO", "ADMIN"] },
            email: { notIn: ["teste@servas.com", "formacao@serva.com", "formacao2026@servos.com"] },
        },
        select: { id: true, name: true },
    });
    return buildShortNamesData(activeUsers);
}

export interface UnavailabilityItem {
    date: string; // YYYY-MM-DD
    reason?: string;
}

export interface ScaleSuspension {
    from: string; // YYYY-MM-DD
    until: string; // YYYY-MM-DD
    reason?: string;
    createdAt?: string;
}

export interface SystemUserMeta {
    genders: Record<string, "M" | "F">;
    unavailabilities: Record<string, UnavailabilityItem[]>;
    reactivatedAt?: Record<string, string>;
    suspensions?: Record<string, ScaleSuspension>;
}

export function getBrazilTodayStr(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

const INACTIVITY_DAYS = 90; // 3 meses sem escalas

// E-mails isentos do bloqueio automático de 3 meses sem escalas
const EXEMPT_AUTO_INACTIVE_EMAILS = new Set([
    "alice@serva.com",
    "camilla@serva.com",
    "camila@serva.com",
    "eduarda@serva.com",
]);

export function isExemptFromAutoInactivation(email?: string | null, name?: string | null): boolean {
    if (email && EXEMPT_AUTO_INACTIVE_EMAILS.has(email.trim().toLowerCase())) {
        return true;
    }
    if (name) {
        const firstName = name
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .split(/\s+/)[0];
        if (
            firstName === "camilla" ||
            firstName === "camila" ||
            firstName === "alice" ||
            firstName === "eduarda"
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Lê os metadados persistidos (gênero, indisponibilidades e data de reativação)
 */
export async function getSystemUserMeta(): Promise<SystemUserMeta> {
    try {
        const record = await prisma.notice.findFirst({
            where: {
                active: false,
                text: { startsWith: META_PREFIX },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!record) {
            return { genders: {}, unavailabilities: {}, reactivatedAt: {}, suspensions: {} };
        }

        const jsonStr = record.text.slice(META_PREFIX.length);
        const parsed = JSON.parse(jsonStr);
        return {
            genders: parsed.genders || {},
            unavailabilities: parsed.unavailabilities || {},
            reactivatedAt: parsed.reactivatedAt || {},
            suspensions: parsed.suspensions || {},
        };
    } catch (err) {
        console.error("[UserMeta] Erro ao ler metadados:", err);
        return { genders: {}, unavailabilities: {}, reactivatedAt: {}, suspensions: {} };
    }
}

async function saveSystemUserMeta(meta: SystemUserMeta): Promise<void> {
    const payload = META_PREFIX + JSON.stringify(meta);
    const existing = await prisma.notice.findFirst({
        where: {
            active: false,
            text: { startsWith: META_PREFIX },
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
 * Get all users (id, name, gender, unavailabilities) — para selects de inscrição e sorteio automático
 */
export async function getUsersList() {
    const [users, meta] = await Promise.all([
        prisma.user.findMany({
            where: { role: { not: "INATIVO" } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        getSystemUserMeta(),
    ]);

    return users.map((u) => ({
        ...u,
        gender: meta.genders[u.id] || null,
        unavailabilities: meta.unavailabilities[u.id] || [],
    }));
}

/**
 * Verifica se o usuário ativo está há mais de 3 meses (90 dias) sem nenhuma escala.
 * Caso esteja (e não tenha sido cadastrado/reativado nos últimos 90 dias), altera seu role para INATIVO.
 */
export async function checkAndAutoInactivateUser(
    userId: string,
    currentRole: string,
    userEmail?: string | null,
    existingMeta?: SystemUserMeta,
    userName?: string | null
): Promise<boolean> {
    if (currentRole !== "USER") return false;
    if (isExemptFromAutoInactivation(userEmail, userName)) return false;

    const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
    const meta = existingMeta || (await getSystemUserMeta());

    const graceIso = meta.reactivatedAt?.[userId];
    if (graceIso && new Date(graceIso) >= cutoff) {
        return false;
    }

    const latestSignup = await prisma.signup.findFirst({
        where: { userId },
        include: { mass: { select: { date: true } } },
        orderBy: { mass: { date: "desc" } },
    });

    if (latestSignup) {
        if (new Date(latestSignup.mass.date) < cutoff) {
            await prisma.user.update({
                where: { id: userId },
                data: { role: "INATIVO" },
            });
            return true;
        }
        return false;
    }

    // Se nunca teve inscrição em missa, verifica se o primeiro acesso já tem mais de 90 dias
    const firstLogin = await prisma.loginLog.findFirst({
        where: { userId },
        orderBy: { timestamp: "asc" },
    });

    if (firstLogin && new Date(firstLogin.timestamp) < cutoff) {
        await prisma.user.update({
            where: { id: userId },
            data: { role: "INATIVO" },
        });
        return true;
    }

    return false;
}

/**
 * Get all users with full details (for Servos management tab)
 */
export async function getUsersListFull() {
    const [users, meta] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                birthDate: true,
                signups: {
                    select: { mass: { select: { date: true } } },
                    orderBy: { mass: { date: "desc" } },
                    take: 1,
                },
                loginLogs: {
                    select: { timestamp: true },
                    orderBy: { timestamp: "asc" },
                    take: 1,
                },
            },
            orderBy: { name: "asc" },
        }),
        getSystemUserMeta(),
    ]);

    const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
    const todayBr = getBrazilTodayStr();
    const autoInactivateIds: string[] = [];

    const mapped = users.map((u) => {
        const lastMassDate = u.signups[0]?.mass?.date ? u.signups[0].mass.date.toISOString() : null;
        const firstLoginDate = u.loginLogs[0]?.timestamp ? u.loginLogs[0].timestamp.toISOString() : null;
        const graceIso = meta.reactivatedAt?.[u.id];
        const hasGrace = Boolean(graceIso && new Date(graceIso) >= cutoff);

        let effectiveRole = u.role;
        const isExempt = isExemptFromAutoInactivation(u.email, u.name);
        if (u.role === "USER" && !hasGrace && !isExempt) {
            if (lastMassDate && new Date(lastMassDate) < cutoff) {
                effectiveRole = "INATIVO";
                autoInactivateIds.push(u.id);
            } else if (!lastMassDate && firstLoginDate && new Date(firstLoginDate) < cutoff) {
                effectiveRole = "INATIVO";
                autoInactivateIds.push(u.id);
            }
        }

        const rawSusp = meta.suspensions?.[u.id];
        const suspension = rawSusp && rawSusp.until >= todayBr ? rawSusp : null;

        return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: effectiveRole,
            birthDate: u.birthDate,
            gender: meta.genders[u.id] || null,
            unavailabilities: meta.unavailabilities[u.id] || [],
            suspension,
            lastMassDate,
            firstLoginDate,
        };
    });

    if (autoInactivateIds.length > 0) {
        await prisma.user.updateMany({
            where: { id: { in: autoInactivateIds } },
            data: { role: "INATIVO" },
        });
    }

    return mapped;
}

/**
 * Create a new servo(a) (user)
 */
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    birthDate?: string;
    role?: string;
    gender?: "M" | "F" | "";
}) {
    // Verificar se email já existe
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        throw new Error("EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const created = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            birthDate: data.birthDate ? new Date(data.birthDate + "T12:00:00") : null,
            role: data.role || "USER",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
    });

    const meta = await getSystemUserMeta();
    meta.reactivatedAt = meta.reactivatedAt || {};
    meta.reactivatedAt[created.id] = new Date().toISOString();
    if (data.gender === "M" || data.gender === "F") {
        meta.genders[created.id] = data.gender;
    }
    await saveSystemUserMeta(meta);

    return {
        ...created,
        gender: data.gender === "M" || data.gender === "F" ? data.gender : null,
    };
}

/**
 * Update an existing servo(a)
 */
export async function updateUser(
    id: string,
    data: { name?: string; email?: string; birthDate?: string; role?: string; gender?: "M" | "F" | "" }
) {
    // Se estiver mudando email, verificar duplicidade
    if (data.email) {
        const existing = await prisma.user.findFirst({
            where: {
                email: data.email,
                id: { not: id },
            },
        });

        if (existing) {
            throw new Error("EMAIL_EXISTS");
        }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.birthDate !== undefined) {
        updateData.birthDate = data.birthDate ? new Date(data.birthDate + "T12:00:00") : null;
    }

    const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            birthDate: true,
        },
    });

    const meta = await getSystemUserMeta();
    let metaChanged = false;
    if (data.role === "USER") {
        meta.reactivatedAt = meta.reactivatedAt || {};
        meta.reactivatedAt[id] = new Date().toISOString();
        metaChanged = true;
    }
    if (data.gender !== undefined) {
        if (data.gender === "M" || data.gender === "F") {
            meta.genders[id] = data.gender;
        } else {
            delete meta.genders[id];
        }
        metaChanged = true;
    }
    if (metaChanged) {
        await saveSystemUserMeta(meta);
    }

    return {
        ...updated,
        gender: meta.genders[id] || null,
    };
}

/**
 * Retorna a lista de indisponibilidades programadas do usuário
 */
export async function getUserUnavailabilities(userId: string): Promise<UnavailabilityItem[]> {
    const meta = await getSystemUserMeta();
    return meta.unavailabilities[userId] || [];
}

/**
 * Adiciona ou atualiza uma indisponibilidade programada para um usuário
 */
export async function addUserUnavailability(userId: string, date: string, reason?: string) {
    const meta = await getSystemUserMeta();
    const list = meta.unavailabilities[userId] || [];
    const filtered = list.filter((item) => item.date !== date);
    filtered.push({ date, reason: reason?.trim() || "Indisponível" });
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    meta.unavailabilities[userId] = filtered;
    await saveSystemUserMeta(meta);
    return filtered;
}

/**
 * Remove uma indisponibilidade programada de um usuário
 */
export async function removeUserUnavailability(userId: string, date: string) {
    const meta = await getSystemUserMeta();
    const list = meta.unavailabilities[userId] || [];
    meta.unavailabilities[userId] = list.filter((item) => item.date !== date);
    await saveSystemUserMeta(meta);
    return meta.unavailabilities[userId];
}

/**
 * Retorna a suspensão ativa/agendada caso o usuário esteja bloqueado hoje ou na data da missa alvo
 */
export async function getActiveScaleSuspension(
    userId: string,
    targetMassDate?: Date | string,
    existingMeta?: SystemUserMeta
): Promise<ScaleSuspension | null> {
    const meta = existingMeta || (await getSystemUserMeta());
    const susp = meta.suspensions?.[userId];
    if (!susp) return null;

    const todayBr = getBrazilTodayStr();
    if (susp.until < todayBr) return null;

    const isActiveToday = todayBr >= susp.from && todayBr <= susp.until;
    let isMassInRange = false;
    if (targetMassDate) {
        const massBrDay = new Date(targetMassDate).toLocaleDateString("en-CA", {
            timeZone: "America/Sao_Paulo",
        });
        isMassInRange = massBrDay >= susp.from && massBrDay <= susp.until;
    }

    return isActiveToday || isMassInRange ? susp : null;
}

/**
 * Define uma suspensão temporária de escalas (o membro mantém acesso ao app, mas não pode pegar escalas)
 */
export async function setUserSuspension(
    userId: string,
    data: { from: string; until: string; reason?: string }
): Promise<ScaleSuspension> {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.from) || !dateRegex.test(data.until)) {
        throw new Error("INVALID_SUSPENSION_DATES");
    }
    if (data.until < data.from) {
        throw new Error("INVALID_SUSPENSION_RANGE");
    }

    const meta = await getSystemUserMeta();
    meta.suspensions = meta.suspensions || {};
    const entry: ScaleSuspension = {
        from: data.from,
        until: data.until,
        reason: data.reason?.trim() || undefined,
        createdAt: new Date().toISOString(),
    };
    meta.suspensions[userId] = entry;
    await saveSystemUserMeta(meta);
    return entry;
}

/**
 * Remove a suspensão temporária de escalas de um membro
 */
export async function removeUserSuspension(userId: string): Promise<void> {
    const meta = await getSystemUserMeta();
    if (meta.suspensions?.[userId]) {
        delete meta.suspensions[userId];
        await saveSystemUserMeta(meta);
    }
}

/**
 * Delete a servo(a) and all related data (signups, logs, subscriptions, swap requests)
 */
export async function deleteUser(id: string) {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Buscar todos os signups do usuário para remover swap requests vinculados
        const signups = await tx.signup.findMany({
            where: { userId: id },
            select: { id: true },
        });

        const signupIds = signups.map((s) => s.id);

        // 2. Remover swap requests ligados aos signups
        if (signupIds.length > 0) {
            await tx.swapRequest.deleteMany({
                where: { signupId: { in: signupIds } },
            });
        }

        // 3. Remover swap requests onde este usuário é o requester
        await tx.swapRequest.deleteMany({
            where: { requesterId: id },
        });

        // 4. Remover signups
        await tx.signup.deleteMany({
            where: { userId: id },
        });

        // 5. Remover login logs
        await tx.loginLog.deleteMany({
            where: { userId: id },
        });

        // 6. Remover push subscriptions
        await tx.pushSubscription.deleteMany({
            where: { userId: id },
        });

        // 7. Finalmente, remover o usuário
        await tx.user.delete({
            where: { id },
        });

        return { deleted: true };
    });

    try {
        const meta = await getSystemUserMeta();
        delete meta.genders[id];
        delete meta.unavailabilities[id];
        if (meta.suspensions) delete meta.suspensions[id];
        await saveSystemUserMeta(meta);
    } catch (e) {
        console.error("[UserMeta] Erro ao limpar metadados do usuário removido:", e);
    }

    return result;
}
