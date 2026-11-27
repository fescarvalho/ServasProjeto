import crypto from "crypto";
import { prisma } from "../config/database";

const PRIZE_META_PREFIX = "__SYS_PRIZE_STATE__:";

// A premiação dos balões passa a valer somente a partir do fechamento de Novembro/2026 (liberado em 01/12/2026)
export const PRIZE_START_YM = "2026-11";

export const DEFAULT_BALLOON_PRIZES: [string, string, string] = [
    "🍫 Kit Chocolate Especial",
    "🧋 Vale Açaí / Lanche",
    "📖 Kit Devocional Católico",
];

export interface PrizeClaimRecord {
    ymKey: string; // "YYYY-MM" (mês 1..12)
    year: number;
    month: number; // 0..11 (padrão JS Date)
    winnerId: string;
    winnerName: string;
    score: number;
    totalPresences: number;
    specialPresences: number;
    balloonIndex: number; // 0, 1 ou 2
    prizeWon: string;
    allBalloons: [string, string, string];
    claimedAt: string;
    delivered: boolean;
    deliveredAt?: string | null;
    skippedPrevWinnerName?: string | null;
}

export interface SystemPrizeState {
    prizes: [string, string, string];
    claims: Record<string, PrizeClaimRecord>;
}

export interface RankedMonthlyCandidate {
    userId: string;
    name: string;
    score: number;
    totalPresences: number;
    specialPresences: number;
    absences: number;
    firstSignupMs: number;
}

export interface MonthlyWinnerResolution {
    ymKey: string;
    year: number;
    month: number; // 0..11
    winner: RankedMonthlyCandidate | null;
    skippedPrevWinner: RankedMonthlyCandidate | null;
    prevWinnerId: string | null;
    ranking: RankedMonthlyCandidate[];
}

export function formatYmKey(year: number, monthZeroBased: number): string {
    return `${year}-${String(monthZeroBased + 1).padStart(2, "0")}`;
}

export function getPreviousMonth(year: number, monthZeroBased: number): { year: number; month: number } {
    if (monthZeroBased === 0) {
        return { year: year - 1, month: 11 };
    }
    return { year, month: monthZeroBased - 1 };
}

export function getBrazilCurrentYearMonth(): { year: number; month: number; day: number } {
    const nowBr = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return {
        year: nowBr.getFullYear(),
        month: nowBr.getMonth(),
        day: nowBr.getDate(),
    };
}

function getMassPointsForDate(dateInput: Date | string, manualPoints?: number | null): number {
    if (manualPoints !== undefined && manualPoints !== null) return manualPoints;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 1;
    const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return brDate.getDay() === 0 ? 1 : 2;
}

export async function getSystemPrizeState(): Promise<SystemPrizeState> {
    try {
        const record = await prisma.notice.findFirst({
            where: {
                active: false,
                text: { startsWith: PRIZE_META_PREFIX },
            },
            orderBy: { createdAt: "desc" },
        });
        if (!record) {
            return {
                prizes: [...DEFAULT_BALLOON_PRIZES] as [string, string, string],
                claims: {},
            };
        }
        const parsed = JSON.parse(record.text.slice(PRIZE_META_PREFIX.length));
        const rawPrizes = Array.isArray(parsed?.prizes) ? parsed.prizes : [];
        const prizes: [string, string, string] = [
            String(rawPrizes[0] || DEFAULT_BALLOON_PRIZES[0]).trim() || DEFAULT_BALLOON_PRIZES[0],
            String(rawPrizes[1] || DEFAULT_BALLOON_PRIZES[1]).trim() || DEFAULT_BALLOON_PRIZES[1],
            String(rawPrizes[2] || DEFAULT_BALLOON_PRIZES[2]).trim() || DEFAULT_BALLOON_PRIZES[2],
        ];
        return {
            prizes,
            claims: parsed?.claims && typeof parsed.claims === "object" ? parsed.claims : {},
        };
    } catch (err) {
        console.error("[PrizeState] Erro ao ler estado de prêmios:", err);
        return {
            prizes: [...DEFAULT_BALLOON_PRIZES] as [string, string, string],
            claims: {},
        };
    }
}

async function saveSystemPrizeState(state: SystemPrizeState): Promise<void> {
    const payload = PRIZE_META_PREFIX + JSON.stringify(state);
    const existing = await prisma.notice.findFirst({
        where: {
            active: false,
            text: { startsWith: PRIZE_META_PREFIX },
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
 * Calcula o ranking completo de um mês (year, month 0..11 no fuso America/Sao_Paulo)
 * Critérios de ordenação:
 * 1º Maior pontuação (score)
 * 2º Mais escalas totais com presença (totalPresences)
 * 3º Mais escalas de 2+ pontos (specialPresences)
 * 4º Menos faltas no mês (absences)
 * 5º Inscrição mais antiga no mês (desempate determinístico)
 */
export async function computeRawMonthRanking(
    year: number,
    monthZeroBased: number
): Promise<RankedMonthlyCandidate[]> {
    // Busca com margem de 2 dias para cobrir fuso horário e filtra exato por America/Sao_Paulo
    const rangeStart = new Date(Date.UTC(year, monthZeroBased, 1, 0, 0, 0) - 48 * 3600 * 1000);
    const rangeEnd = new Date(Date.UTC(year, monthZeroBased + 1, 1, 0, 0, 0) + 48 * 3600 * 1000);

    const masses = await prisma.mass.findMany({
        where: {
            date: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
            signups: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            },
        },
    });

    const now = new Date();
    const map: Record<string, RankedMonthlyCandidate> = {};

    for (const mass of masses) {
        const brDate = new Date(mass.date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        if (brDate.getFullYear() !== year || brDate.getMonth() !== monthZeroBased) {
            continue;
        }

        const isPast = mass.date < now;
        const pts = getMassPointsForDate(mass.date, mass.points);

        for (const signup of mass.signups) {
            if (signup.status === "RESERVA") continue;
            const u = signup.user;
            if (!u || u.role === "ADMIN" || u.role === "INATIVO") continue;
            if (["teste@servas.com", "formacao@serva.com", "formacao2026@servos.com"].includes(u.email)) {
                continue;
            }

            if (!map[u.id]) {
                map[u.id] = {
                    userId: u.id,
                    name: u.name,
                    score: 0,
                    totalPresences: 0,
                    specialPresences: 0,
                    absences: 0,
                    firstSignupMs: signup.createdAt ? signup.createdAt.getTime() : Number.MAX_SAFE_INTEGER,
                };
            } else if (signup.createdAt && signup.createdAt.getTime() < map[u.id].firstSignupMs) {
                map[u.id].firstSignupMs = signup.createdAt.getTime();
            }

            if (signup.present) {
                map[u.id].score += pts;
                map[u.id].totalPresences += 1;
                if (pts >= 2) {
                    map[u.id].specialPresences += 1;
                }
            } else if (isPast) {
                map[u.id].absences += 1;
            }
        }
    }

    return Object.values(map)
        .filter((c) => c.totalPresences > 0 && c.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.totalPresences !== a.totalPresences) return b.totalPresences - a.totalPresences;
            if (b.specialPresences !== a.specialPresences) return b.specialPresences - a.specialPresences;
            if (a.absences !== b.absences) return a.absences - b.absences;
            if (a.firstSignupMs !== b.firstSignupMs) return a.firstSignupMs - b.firstSignupMs;
            return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
        });
}

/**
 * Resolve o vencedor elegível de (year, month), aplicando a regra:
 * "Quem ganhou no mês passado não pode ganhar no mês atual."
 */
export async function resolveMonthlyWinner(
    year: number,
    monthZeroBased: number,
    existingState?: SystemPrizeState,
    depth = 2
): Promise<MonthlyWinnerResolution> {
    const state = existingState || (await getSystemPrizeState());
    const ymKey = formatYmKey(year, monthZeroBased);

    // Determinar quem venceu o mês imediatamente anterior (somente a partir do início oficial PRIZE_START_YM)
    const prev = getPreviousMonth(year, monthZeroBased);
    const prevKey = formatYmKey(prev.year, prev.month);
    let prevWinnerId: string | null = null;

    if (prevKey >= PRIZE_START_YM) {
        if (state.claims[prevKey]) {
            prevWinnerId = state.claims[prevKey].winnerId;
        } else if (depth > 0) {
            const prevRes = await resolveMonthlyWinner(prev.year, prev.month, state, depth - 1);
            prevWinnerId = prevRes.winner?.userId || null;
        }
    }

    const ranking = await computeRawMonthRanking(year, monthZeroBased);
    if (ranking.length === 0) {
        return {
            ymKey,
            year,
            month: monthZeroBased,
            winner: null,
            skippedPrevWinner: null,
            prevWinnerId,
            ranking: [],
        };
    }

    // Se já houve resgate registrado para este mês, honrar o registro salvo
    if (state.claims[ymKey]) {
        const claimedWinner =
            ranking.find((r) => r.userId === state.claims[ymKey].winnerId) || {
                userId: state.claims[ymKey].winnerId,
                name: state.claims[ymKey].winnerName,
                score: state.claims[ymKey].score,
                totalPresences: state.claims[ymKey].totalPresences,
                specialPresences: state.claims[ymKey].specialPresences,
                absences: 0,
                firstSignupMs: 0,
            };
        const skipped =
            prevWinnerId && ranking[0]?.userId === prevWinnerId ? ranking[0] : null;
        return {
            ymKey,
            year,
            month: monthZeroBased,
            winner: claimedWinner,
            skippedPrevWinner: skipped,
            prevWinnerId,
            ranking,
        };
    }

    let skippedPrevWinner: RankedMonthlyCandidate | null = null;
    let winner: RankedMonthlyCandidate | null = null;

    for (const candidate of ranking) {
        if (prevWinnerId && candidate.userId === prevWinnerId) {
            if (!skippedPrevWinner) {
                skippedPrevWinner = candidate;
            }
            continue;
        }
        winner = candidate;
        break;
    }

    // Caso extremo em que apenas 1 pessoa serviu no mês inteiro e era a vencedora anterior
    if (!winner && ranking.length > 0 && !prevWinnerId) {
        winner = ranking[0];
    }

    return {
        ymKey,
        year,
        month: monthZeroBased,
        winner,
        skippedPrevWinner,
        prevWinnerId,
        ranking,
    };
}

function shuffleThreePrizes(prizes: [string, string, string]): [string, string, string] {
    const arr: [string, string, string] = [prizes[0], prizes[1], prizes[2]];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function listClosedMonthsSinceStart(
    curYear: number,
    curMonthZeroBased: number
): { year: number; month: number; ymKey: string }[] {
    const result: { year: number; month: number; ymKey: string }[] = [];
    let cursor = getPreviousMonth(curYear, curMonthZeroBased);
    // Limita a até 12 meses fechados para trás, parando em PRIZE_START_YM
    for (let i = 0; i < 12; i++) {
        const ymKey = formatYmKey(cursor.year, cursor.month);
        if (ymKey < PRIZE_START_YM) break;
        result.push({ year: cursor.year, month: cursor.month, ymKey });
        cursor = getPreviousMonth(cursor.year, cursor.month);
    }
    return result; // mais recente primeiro
}

/**
 * Verifica se o servo autenticado tem balão pendente (ou já estourado) a partir de Novembro/2026.
 * Enquanto não estourar um balão, continua retornando alreadyClaimed=false em todos os logins!
 */
export async function getMyPendingBalloonStatus(userId: string) {
    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const closedMonths = listClosedMonthsSinceStart(curYear, curMonth);

    // Antes de 01/12/2026 não há nenhum mês fechado >= 2026-11
    if (closedMonths.length === 0) {
        return { eligible: false };
    }

    const state = await getSystemPrizeState();

    // 1º Prioridade: qualquer mês fechado (>= 2026-11) vencido por este servo que AINDA NÃO teve balão estourado
    for (const m of closedMonths) {
        if (state.claims[m.ymKey]) continue;
        const resolution = await resolveMonthlyWinner(m.year, m.month, state);
        if (resolution.winner && resolution.winner.userId === userId) {
            return {
                eligible: true,
                alreadyClaimed: false,
                ymKey: m.ymKey,
                year: m.year,
                month: m.month,
                score: resolution.winner.score,
                totalPresences: resolution.winner.totalPresences,
                specialPresences: resolution.winner.specialPresences,
            };
        }
    }

    // 2º Caso já tenha estourado o balão do último mês fechado, retorna o prêmio para exibir status até ser entregue
    const latest = closedMonths[0];
    const existingClaim = state.claims[latest.ymKey];
    if (existingClaim && existingClaim.winnerId === userId) {
        return {
            eligible: true,
            alreadyClaimed: true,
            ymKey: latest.ymKey,
            year: latest.year,
            month: latest.month,
            score: existingClaim.score,
            totalPresences: existingClaim.totalPresences,
            specialPresences: existingClaim.specialPresences,
            claim: existingClaim,
        };
    }

    return { eligible: false };
}

/**
 * Estoura um dos 3 balões (0, 1 ou 2) para o vencedor elegível do mês fechado
 */
export async function popWinnerBalloon(
    userId: string,
    year: number,
    monthZeroBased: number,
    balloonIndex: number
): Promise<PrizeClaimRecord> {
    if (![0, 1, 2].includes(balloonIndex)) {
        throw new Error("Escolha um balão válido (1, 2 ou 3).");
    }

    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const isCompletedMonth =
        year < curYear || (year === curYear && monthZeroBased < curMonth);
    if (!isCompletedMonth) {
        throw new Error("A premiação deste mês só é liberada após o encerramento do mês.");
    }

    const state = await getSystemPrizeState();
    const ymKey = formatYmKey(year, monthZeroBased);

    if (ymKey < PRIZE_START_YM) {
        throw new Error("A premiação por balões é válida somente a partir de Novembro/2026.");
    }

    // Idempotência: se já estourou antes, retorna o mesmo prêmio sem permitir novo sorteio
    if (state.claims[ymKey]) {
        if (state.claims[ymKey].winnerId !== userId) {
            throw new Error("A premiação deste mês pertence a outro(a) servo(a).");
        }
        return state.claims[ymKey];
    }

    const resolution = await resolveMonthlyWinner(year, monthZeroBased, state);
    if (!resolution.winner || resolution.winner.userId !== userId) {
        throw new Error("Você não está elegível para estourar o balão deste mês.");
    }

    const shuffled = shuffleThreePrizes(state.prizes);
    const prizeWon = shuffled[balloonIndex];

    const claim: PrizeClaimRecord = {
        ymKey,
        year,
        month: monthZeroBased,
        winnerId: userId,
        winnerName: resolution.winner.name,
        score: resolution.winner.score,
        totalPresences: resolution.winner.totalPresences,
        specialPresences: resolution.winner.specialPresences,
        balloonIndex,
        prizeWon,
        allBalloons: shuffled,
        claimedAt: new Date().toISOString(),
        delivered: false,
        deliveredAt: null,
        skippedPrevWinnerName: resolution.skippedPrevWinner?.name || null,
    };

    state.claims[ymKey] = claim;
    await saveSystemPrizeState(state);

    return claim;
}

/**
 * Atualiza os 3 presentes fixos configurados pelo Admin
 */
export async function updateBalloonPrizes(prizes: [string, string, string]): Promise<[string, string, string]> {
    if (!Array.isArray(prizes) || prizes.length !== 3) {
        throw new Error("Informe exatamente os 3 presentes dos balões.");
    }
    const cleaned = prizes.map((p) => String(p || "").trim()) as [string, string, string];
    if (cleaned.some((p) => !p)) {
        throw new Error("Nenhum dos 3 presentes pode ficar em branco.");
    }

    const state = await getSystemPrizeState();
    state.prizes = cleaned;
    await saveSystemPrizeState(state);
    return state.prizes;
}

/**
 * Marca ou desmarca um prêmio sorteado como entregue pelo Admin
 */
export async function setPrizeClaimDelivered(ymKey: string, delivered: boolean): Promise<PrizeClaimRecord> {
    const state = await getSystemPrizeState();
    const claim = state.claims[ymKey];
    if (!claim) {
        throw new Error("Registro de prêmio não encontrado.");
    }
    claim.delivered = Boolean(delivered);
    claim.deliveredAt = claim.delivered ? new Date().toISOString() : null;
    await saveSystemPrizeState(state);
    return claim;
}

/**
 * Retorna visão completa de prêmios, último mês fechado e histórico de ganhadores para o Admin
 */
export async function getAdminPrizeOverview() {
    const state = await getSystemPrizeState();
    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const lastClosed = getPreviousMonth(curYear, curMonth);
    const lastClosedKey = formatYmKey(lastClosed.year, lastClosed.month);
    const notStartedYet = lastClosedKey < PRIZE_START_YM;

    const claimsList = Object.values(state.claims).sort((a, b) => b.ymKey.localeCompare(a.ymKey));

    if (notStartedYet) {
        // Enquanto Novembro/2026 ainda está em andamento, mostra a prévia parcial de Novembro/2026 sem liberar balão de Outubro
        const currentPreview = await resolveMonthlyWinner(curYear, curMonth, state);
        return {
            prizes: state.prizes,
            claims: claimsList,
            prizeStartYm: PRIZE_START_YM,
            notStartedYet: true,
            lastClosedMonth: {
                ymKey: currentPreview.ymKey,
                year: curYear,
                month: curMonth,
                isInProgressPreview: true,
                winner: currentPreview.winner
                    ? {
                          userId: currentPreview.winner.userId,
                          name: currentPreview.winner.name,
                          score: currentPreview.winner.score,
                          totalPresences: currentPreview.winner.totalPresences,
                          specialPresences: currentPreview.winner.specialPresences,
                      }
                    : null,
                skippedPrevWinner: null,
                claim: null,
            },
        };
    }

    const lastMonthResolution = await resolveMonthlyWinner(lastClosed.year, lastClosed.month, state);

    return {
        prizes: state.prizes,
        claims: claimsList,
        prizeStartYm: PRIZE_START_YM,
        notStartedYet: false,
        lastClosedMonth: {
            ymKey: lastMonthResolution.ymKey,
            year: lastClosed.year,
            month: lastClosed.month,
            isInProgressPreview: false,
            winner: lastMonthResolution.winner
                ? {
                      userId: lastMonthResolution.winner.userId,
                      name: lastMonthResolution.winner.name,
                      score: lastMonthResolution.winner.score,
                      totalPresences: lastMonthResolution.winner.totalPresences,
                      specialPresences: lastMonthResolution.winner.specialPresences,
                  }
                : null,
            skippedPrevWinner: lastMonthResolution.skippedPrevWinner
                ? {
                      userId: lastMonthResolution.skippedPrevWinner.userId,
                      name: lastMonthResolution.skippedPrevWinner.name,
                      score: lastMonthResolution.skippedPrevWinner.score,
                  }
                : null,
            claim: state.claims[lastMonthResolution.ymKey] || null,
        },
    };
}
