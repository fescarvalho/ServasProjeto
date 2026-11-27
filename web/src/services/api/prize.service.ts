import { apiClient } from "./client";

export interface PrizeClaimRecord {
    ymKey: string;
    year: number;
    month: number;
    winnerId: string;
    winnerName: string;
    score: number;
    totalPresences: number;
    specialPresences: number;
    balloonIndex: number;
    prizeWon: string;
    allBalloons: [string, string, string];
    claimedAt: string;
    delivered: boolean;
    deliveredAt?: string | null;
    skippedPrevWinnerName?: string | null;
}

export interface MyPendingPrizeResponse {
    eligible: boolean;
    alreadyClaimed?: boolean;
    ymKey?: string;
    year?: number;
    month?: number;
    score?: number;
    totalPresences?: number;
    specialPresences?: number;
    claim?: PrizeClaimRecord;
}

export interface AdminPrizeOverview {
    prizes: [string, string, string];
    claims: PrizeClaimRecord[];
    prizeStartYm?: string;
    notStartedYet?: boolean;
    lastClosedMonth: {
        ymKey: string;
        year: number;
        month: number;
        isInProgressPreview?: boolean;
        winner: {
            userId: string;
            name: string;
            score: number;
            totalPresences: number;
            specialPresences: number;
        } | null;
        skippedPrevWinner: {
            userId: string;
            name: string;
            score: number;
        } | null;
        claim: PrizeClaimRecord | null;
    };
}

export async function getMyPendingPrize(): Promise<MyPendingPrizeResponse> {
    const res = await apiClient.get<MyPendingPrizeResponse>(`/prizes/my-pending?_t=${Date.now()}`);
    return res.data;
}

export async function popWinnerBalloon(
    year: number,
    month: number,
    balloonIndex: number
): Promise<PrizeClaimRecord> {
    const res = await apiClient.post<PrizeClaimRecord>("/prizes/pop", {
        year,
        month,
        balloonIndex,
    });
    return res.data;
}

export async function getAdminPrizeOverview(): Promise<AdminPrizeOverview> {
    const res = await apiClient.get<AdminPrizeOverview>(`/prizes/admin?_t=${Date.now()}`);
    return res.data;
}

export async function updateBalloonPrizes(
    prizes: [string, string, string]
): Promise<{ prizes: [string, string, string] }> {
    const res = await apiClient.put<{ prizes: [string, string, string] }>("/prizes/admin/config", {
        prizes,
    });
    return res.data;
}

export async function setPrizeDelivered(
    ymKey: string,
    delivered: boolean
): Promise<PrizeClaimRecord> {
    const res = await apiClient.patch<PrizeClaimRecord>(
        `/prizes/admin/claims/${encodeURIComponent(ymKey)}/delivered`,
        { delivered }
    );
    return res.data;
}
