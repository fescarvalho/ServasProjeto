import crypto from "crypto";
import { prisma } from "../config/database";

const PRIZE_META_PREFIX = "__SYS_PRIZE_STATE__:";

// A premiação dos balões passa a valer somente a partir do fechamento de Novembro/2026 (liberado em 01/12/2026)
export const PRIZE_START_YM = "2026-11";
export const TEST_CLAIM_KEY = "TESTE-SIMULACAO";
const TEST_ACCOUNT_EMAIL = "teste@servas.com";
export const BALLOON_COUNT = 10;

export const DEFAULT_BALLOON_PRIZES: string[] = [
    "🍪 Kit de biscoitos artesanais",
    "🍣 Vale lanche / vale japonês",
    "💸 Pix de R$ 30,00",
    "🍫 Chocolates",
    "📖 Livro católico",
    "🍪 Voucher de R$ 40,00 na Camilla Cookies",
    "☕ Caneca",
    "💸 Pix de R$ 40,00",
    "📿 Terço",
    "🎁 Presente surpresa",
];

export interface PrizeClaimRecord {
    ymKey: string; // "YYYY-MM", "MANUAL-..." ou TEST_CLAIM_KEY
    customLabel?: string | null;
    year: number;
    month: number; // 0..11 (padrão JS Date)
    winnerId: string;
    winnerName: string;
    score: number;
    totalPresences: number;
    specialPresences: number;
    balloonIndex: number; // 0..9
    prizeWon: string;
    allBalloons: string[];
    claimedAt: string;
    delivered: boolean;
    deliveredAt?: string | null;
    skippedPrevWinnerName?: string | null;
}

export interface ManualBalloonGrant {
    id: string;
    userId: string;
    userName: string;
    label: string;
    year: number;
    month: number; // 0..11
    score: number;
    totalPresences: number;
    specialPresences: number;
    createdAt: string;
}

export interface SystemPrizeState {
    prizes: string[];
    claims: Record<string, PrizeClaimRecord>;
    manualGrants?: ManualBalloonGrant[];
    testActive?: boolean;
    testRound?: number;
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
                prizes: [...DEFAULT_BALLOON_PRIZES],
                claims: {},
            };
        }
        const parsed = JSON.parse(record.text.slice(PRIZE_META_PREFIX.length));
        const rawPrizes = Array.isArray(parsed?.prizes) ? parsed.prizes : [];
        const prizes: string[] =
            rawPrizes.length === BALLOON_COUNT
                ? rawPrizes.map(
                      (p: any, idx: number) =>
                          String(p || DEFAULT_BALLOON_PRIZES[idx]).trim() || DEFAULT_BALLOON_PRIZES[idx]
                  )
                : [...DEFAULT_BALLOON_PRIZES];

        return {
            prizes,
            claims: parsed?.claims && typeof parsed.claims === "object" ? parsed.claims : {},
            manualGrants: Array.isArray(parsed?.manualGrants) ? parsed.manualGrants : [],
            testActive: Boolean(parsed?.testActive),
            testRound: typeof parsed?.testRound === "number" ? parsed.testRound : 1,
        };
    } catch (err) {
        console.error("[PrizeState] Erro ao ler estado de prêmios:", err);
        return {
            prizes: [...DEFAULT_BALLOON_PRIZES],
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

function seededShufflePrizes(prizes: string[], seedKey: string): string[] {
    const arr = [...prizes];
    const secret = process.env.JWT_SECRET || "servas-santa-terezinha-balloons";
    for (let i = arr.length - 1; i > 0; i--) {
        const digest = crypto
            .createHash("sha256")
            .update(`${secret}:monthly-balloons:${seedKey}:${i}`)
            .digest();
        const randInt = digest.readUInt32BE(0);
        const j = randInt % (i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

/**
 * Gera a ordem dos 10 presentes para um mês específico (ymKey = "YYYY-MM"),
 * mudando automaticamente a posição de todos os balões a cada novo mês!
 */
export function getMonthlyBalloonOrder(prizes: string[], ymKey: string): string[] {
    const match = ymKey.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        return seededShufflePrizes(prizes, ymKey);
    }
    const year = Number(match[1]);
    const monthZero = Number(match[2]) - 1;
    const prev = getPreviousMonth(year, monthZero);
    const prevOrder = seededShufflePrizes(prizes, formatYmKey(prev.year, prev.month));

    let attempt = 0;
    let currentOrder = seededShufflePrizes(prizes, ymKey);
    // Garante permutação sem ponto fixo: NENHUM dos 10 balões permanece com o mesmo presente do mês anterior!
    while (
        attempt < 50 &&
        currentOrder.length > 1 &&
        currentOrder.some((p, idx) => p === prevOrder[idx])
    ) {
        attempt += 1;
        currentOrder = seededShufflePrizes(prizes, `${ymKey}:rot${attempt}`);
    }
    return currentOrder;
}

function listClosedMonthsSinceStart(
    curYear: number,
    curMonthZeroBased: number
): { year: number; month: number; ymKey: string }[] {
    const result: { year: number; month: number; ymKey: string }[] = [];
    let cursor = getPreviousMonth(curYear, curMonthZeroBased);
    for (let i = 0; i < 12; i++) {
        const ymKey = formatYmKey(cursor.year, cursor.month);
        if (ymKey < PRIZE_START_YM) break;
        result.push({ year: cursor.year, month: cursor.month, ymKey });
        cursor = getPreviousMonth(cursor.year, cursor.month);
    }
    return result;
}

/**
 * Verifica se o servo autenticado tem balão pendente (ou já estourado) a partir de Novembro/2026.
 * Enquanto não estourar um balão, continua retornando alreadyClaimed=false em todos os logins!
 */
export async function getMyPendingBalloonStatus(userId: string) {
    const state = await getSystemPrizeState();

    // Modo de simulação exclusivo para a conta Serva Teste (teste@servas.com)
    if (state.testActive) {
        const u = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (u && u.email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL) {
            const testClaim = state.claims[TEST_CLAIM_KEY];
            if (testClaim) {
                return {
                    eligible: true,
                    alreadyClaimed: true,
                    ymKey: TEST_CLAIM_KEY,
                    year: 2026,
                    month: 10,
                    score: testClaim.score,
                    totalPresences: testClaim.totalPresences,
                    specialPresences: testClaim.specialPresences,
                    claim: testClaim,
                };
            }
            return {
                eligible: true,
                alreadyClaimed: false,
                ymKey: TEST_CLAIM_KEY,
                year: 2026,
                month: 10,
                score: 12,
                totalPresences: 7,
                specialPresences: 5,
            };
        }
    }

    // 1º Disparos manuais/retroativos pendentes para este servo(a) (ainda não estourados)
    const manualGrants = state.manualGrants || [];
    const pendingGrant = manualGrants.find((g) => g.userId === userId && !state.claims[g.id]);
    if (pendingGrant) {
        return {
            eligible: true,
            alreadyClaimed: false,
            ymKey: pendingGrant.id,
            customLabel: pendingGrant.label,
            year: pendingGrant.year,
            month: pendingGrant.month,
            score: pendingGrant.score,
            totalPresences: pendingGrant.totalPresences,
            specialPresences: pendingGrant.specialPresences,
        };
    }

    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const closedMonths = listClosedMonthsSinceStart(curYear, curMonth);

    // 2º Meses oficiais fechados (>= 2026-11) vencidos por este servo e ainda não estourados
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

    // 3º Caso já tenha estourado um balão manual ainda pendente de entrega, exibe o lembrete do prêmio
    const myUndeliveredManualClaim = manualGrants
        .map((g) => state.claims[g.id])
        .find((c) => c && c.winnerId === userId && !c.delivered);
    if (myUndeliveredManualClaim) {
        return {
            eligible: true,
            alreadyClaimed: true,
            ymKey: myUndeliveredManualClaim.ymKey,
            customLabel: myUndeliveredManualClaim.customLabel || undefined,
            year: myUndeliveredManualClaim.year,
            month: myUndeliveredManualClaim.month,
            score: myUndeliveredManualClaim.score,
            totalPresences: myUndeliveredManualClaim.totalPresences,
            specialPresences: myUndeliveredManualClaim.specialPresences,
            claim: myUndeliveredManualClaim,
        };
    }

    if (closedMonths.length === 0) {
        return { eligible: false };
    }

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
 * Estoura um dos 10 balões (0 a 9) para o vencedor elegível do mês fechado
 */
export async function popWinnerBalloon(
    userId: string,
    year: number,
    monthZeroBased: number,
    balloonIndex: number,
    requestedYmKey?: string
): Promise<PrizeClaimRecord> {
    if (!Number.isInteger(balloonIndex) || balloonIndex < 0 || balloonIndex >= BALLOON_COUNT) {
        throw new Error(`Escolha um balão válido (1 a ${BALLOON_COUNT}).`);
    }

    const state = await getSystemPrizeState();

    // 1. Verifica se é um disparo manual/retroativo destinado a este usuário
    const manualGrants = state.manualGrants || [];
    const matchingGrant = requestedYmKey
        ? manualGrants.find((g) => g.id === requestedYmKey && g.userId === userId)
        : manualGrants.find(
              (g) =>
                  g.userId === userId &&
                  !state.claims[g.id] &&
                  g.year === year &&
                  g.month === monthZeroBased
          );

    if (matchingGrant) {
        if (state.claims[matchingGrant.id]) {
            return state.claims[matchingGrant.id];
        }
        const shuffledManual = getMonthlyBalloonOrder(
            state.prizes,
            `${matchingGrant.id}:${matchingGrant.userId}`
        );
        const manualClaim: PrizeClaimRecord = {
            ymKey: matchingGrant.id,
            customLabel: matchingGrant.label,
            year: matchingGrant.year,
            month: matchingGrant.month,
            winnerId: userId,
            winnerName: matchingGrant.userName,
            score: matchingGrant.score,
            totalPresences: matchingGrant.totalPresences,
            specialPresences: matchingGrant.specialPresences,
            balloonIndex,
            prizeWon: shuffledManual[balloonIndex],
            allBalloons: shuffledManual,
            claimedAt: new Date().toISOString(),
            delivered: false,
            deliveredAt: null,
            skippedPrevWinnerName: null,
        };
        state.claims[matchingGrant.id] = manualClaim;
        await saveSystemPrizeState(state);
        return manualClaim;
    }

    // Suporte isolado para a conta Serva Teste quando o modo de teste está ativo
    if (state.testActive) {
        const u = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });
        if (u && u.email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL) {
            if (state.claims[TEST_CLAIM_KEY]) {
                return state.claims[TEST_CLAIM_KEY];
            }
            const shuffledTest = getMonthlyBalloonOrder(
                state.prizes,
                `${TEST_CLAIM_KEY}:${state.testRound || 1}`
            );
            const testClaim: PrizeClaimRecord = {
                ymKey: TEST_CLAIM_KEY,
                year: 2026,
                month: 10,
                winnerId: u.id,
                winnerName: `${u.name} (Simulação)`,
                score: 12,
                totalPresences: 7,
                specialPresences: 5,
                balloonIndex,
                prizeWon: shuffledTest[balloonIndex],
                allBalloons: shuffledTest,
                claimedAt: new Date().toISOString(),
                delivered: false,
                deliveredAt: null,
                skippedPrevWinnerName: null,
            };
            state.claims[TEST_CLAIM_KEY] = testClaim;
            await saveSystemPrizeState(state);
            return testClaim;
        }
    }

    const { year: curYear, month: curMonth } = getBrazilCurrentYearMonth();
    const isCompletedMonth =
        year < curYear || (year === curYear && monthZeroBased < curMonth);
    if (!isCompletedMonth) {
        throw new Error("A premiação deste mês só é liberada após o encerramento do mês.");
    }

    const ymKey = formatYmKey(year, monthZeroBased);

    if (ymKey < PRIZE_START_YM) {
        throw new Error("A premiação por balões é válida somente a partir de Novembro/2026.");
    }

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

    const shuffled = getMonthlyBalloonOrder(state.prizes, ymKey);
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
 * Atualiza os 10 presentes fixos configurados pelo Admin
 */
export async function updateBalloonPrizes(prizes: string[]): Promise<string[]> {
    if (!Array.isArray(prizes) || prizes.length !== BALLOON_COUNT) {
        throw new Error(`Informe exatamente os ${BALLOON_COUNT} presentes dos balões.`);
    }
    const cleaned = prizes.map((p) => String(p || "").trim());
    if (cleaned.some((p) => !p)) {
        throw new Error(`Nenhum dos ${BALLOON_COUNT} presentes pode ficar em branco.`);
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

export async function startOrResetTestBalloon(): Promise<void> {
    const state = await getSystemPrizeState();
    state.testActive = true;
    state.testRound = (state.testRound || 0) + 1;
    delete state.claims[TEST_CLAIM_KEY];
    await saveSystemPrizeState(state);
}

export async function clearTestBalloon(): Promise<void> {
    const state = await getSystemPrizeState();
    state.testActive = false;
    delete state.claims[TEST_CLAIM_KEY];
    await saveSystemPrizeState(state);
}

const PT_MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Dispara balões manualmente para um(a) servo(a) específico(a) (ex: meses anteriores pendentes)
 */
export async function createManualBalloonGrant(data: {
    userId: string;
    year: number;
    month: number; // 0..11
    customLabel?: string;
}): Promise<ManualBalloonGrant> {
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, role: true },
    });
    if (!user || user.role === "INATIVO") {
        throw new Error("Servo(a) não encontrado(a) ou inativo(a).");
    }

    const state = await getSystemPrizeState();
    state.manualGrants = state.manualGrants || [];

    const label =
        (data.customLabel || "").trim() ||
        `${PT_MONTH_NAMES[data.month] || "Mês"}/${data.year}`;

    // Evita duplicar o mesmo disparo pendente para a mesma pessoa e mesmo rótulo
    const existingPending = state.manualGrants.find(
        (g) => g.userId === user.id && g.label === label && !state.claims[g.id]
    );
    if (existingPending) {
        return existingPending;
    }

    // Busca pontuação real daquele mês caso exista no histórico
    const monthRanking = await computeRawMonthRanking(data.year, data.month);
    const statsInMonth = monthRanking.find((r) => r.userId === user.id);

    const grant: ManualBalloonGrant = {
        id: `MANUAL-${data.year}-${String(data.month + 1).padStart(2, "0")}-${user.id.slice(0, 8)}-${Date.now().toString(36)}`,
        userId: user.id,
        userName: user.name,
        label,
        year: data.year,
        month: data.month,
        score: statsInMonth?.score || 0,
        totalPresences: statsInMonth?.totalPresences || 0,
        specialPresences: statsInMonth?.specialPresences || 0,
        createdAt: new Date().toISOString(),
    };

    state.manualGrants.push(grant);
    await saveSystemPrizeState(state);
    return grant;
}

export async function removeManualBalloonGrant(grantId: string): Promise<void> {
    const state = await getSystemPrizeState();
    state.manualGrants = (state.manualGrants || []).filter((g) => g.id !== grantId);
    // Se ainda não foi entregue e o admin quis cancelar um disparo pendente, mantém claims já estourados intactos
    await saveSystemPrizeState(state);
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

    const claimsList = Object.values(state.claims).sort((a, b) =>
        (b.claimedAt || b.ymKey).localeCompare(a.claimedAt || a.ymKey)
    );
    const pendingManualGrants = (state.manualGrants || []).filter((g) => !state.claims[g.id]);

    if (notStartedYet) {
        const currentPreview = await resolveMonthlyWinner(curYear, curMonth, state);
        return {
            prizes: state.prizes,
            claims: claimsList,
            pendingManualGrants,
            testActive: Boolean(state.testActive),
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
        pendingManualGrants,
        testActive: Boolean(state.testActive),
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
