import { apiClient } from "./client";

export interface PrizeClaimRecord {
    ymKey: string;
    customLabel?: string | null;
    year: number;
    month: number;
    winnerId: string;
    winnerName: string;
    score: number;
    totalPresences: number;
    specialPresences: number;
    balloonIndex: number;
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
    month: number;
    score: number;
    totalPresences: number;
    specialPresences: number;
    createdAt: string;
}

export interface MyPendingPrizeResponse {
    eligible: boolean;
    alreadyClaimed?: boolean;
    ymKey?: string;
    customLabel?: string;
    year?: number;
    month?: number;
    score?: number;
    totalPresences?: number;
    specialPresences?: number;
    claim?: PrizeClaimRecord;
}

export interface AdminPrizeOverview {
    prizes: string[];
    claims: PrizeClaimRecord[];
    pendingManualGrants?: ManualBalloonGrant[];
    testActive?: boolean;
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
    balloonIndex: number,
    ymKey?: string
): Promise<PrizeClaimRecord> {
    const res = await apiClient.post<PrizeClaimRecord>("/prizes/pop", {
        year,
        month,
        balloonIndex,
        ymKey,
    });
    return res.data;
}

export async function getAdminPrizeOverview(): Promise<AdminPrizeOverview> {
    const res = await apiClient.get<AdminPrizeOverview>(`/prizes/admin?_t=${Date.now()}`);
    return res.data;
}

export async function updateBalloonPrizes(
    prizes: string[]
): Promise<{ prizes: string[] }> {
    const res = await apiClient.put<{ prizes: string[] }>("/prizes/admin/config", {
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

export async function createManualBalloonGrant(data: {
    userId: string;
    year: number;
    month: number;
    customLabel?: string;
}): Promise<ManualBalloonGrant> {
    const res = await apiClient.post<ManualBalloonGrant>("/prizes/admin/grants", data);
    return res.data;
}

export async function deleteManualBalloonGrant(grantId: string): Promise<void> {
    await apiClient.delete(`/prizes/admin/grants/${encodeURIComponent(grantId)}`);
}

export async function startOrResetTestBalloon(): Promise<void> {
    await apiClient.post("/prizes/admin/test/start");
}

export async function clearTestBalloon(): Promise<void> {
    await apiClient.delete("/prizes/admin/test");
}
