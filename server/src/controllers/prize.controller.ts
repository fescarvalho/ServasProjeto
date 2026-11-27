import { Request, Response } from "express";
import * as prizeService from "../services/prize.service";
import { success, error, badRequest } from "../utils/response.utils";

export async function getMyPendingPrize(req: Request, res: Response) {
    try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        if (!req.userId) {
            return res.status(401).json({ error: "Não autenticado." });
        }
        const status = await prizeService.getMyPendingBalloonStatus(String(req.userId));
        return success(res, status);
    } catch (err: any) {
        console.error("Get pending prize error:", err);
        return error(res, err.message || "Erro ao verificar premiação mensal");
    }
}

export async function popBalloon(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Não autenticado." });
        }
        const { year, month, balloonIndex } = req.body || {};
        if (
            typeof year !== "number" ||
            typeof month !== "number" ||
            typeof balloonIndex !== "number"
        ) {
            return badRequest(res, "Dados inválidos para sortear o balão.");
        }
        const claim = await prizeService.popWinnerBalloon(
            String(req.userId),
            year,
            month,
            balloonIndex
        );
        return success(res, claim);
    } catch (err: any) {
        console.error("Pop balloon error:", err);
        return badRequest(res, err.message || "Não foi possível estourar o balão.");
    }
}

export async function getAdminOverview(req: Request, res: Response) {
    try {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        const data = await prizeService.getAdminPrizeOverview();
        return success(res, data);
    } catch (err: any) {
        console.error("Get admin prize overview error:", err);
        return error(res, err.message || "Erro ao carregar dados de premiação");
    }
}

export async function updatePrizesConfig(req: Request, res: Response) {
    try {
        const { prizes } = req.body || {};
        const updated = await prizeService.updateBalloonPrizes(prizes);
        return success(res, { prizes: updated });
    } catch (err: any) {
        console.error("Update prizes config error:", err);
        return badRequest(res, err.message || "Erro ao salvar os presentes dos balões");
    }
}

export async function toggleClaimDelivered(req: Request, res: Response) {
    try {
        const { ymKey } = req.params;
        const { delivered } = req.body || {};
        const claim = await prizeService.setPrizeClaimDelivered(String(ymKey), Boolean(delivered));
        return success(res, claim);
    } catch (err: any) {
        console.error("Toggle prize delivered error:", err);
        return badRequest(res, err.message || "Erro ao atualizar entrega do prêmio");
    }
}

export async function startTestBalloon(req: Request, res: Response) {
    try {
        await prizeService.startOrResetTestBalloon();
        return success(res, { ok: true });
    } catch (err: any) {
        console.error("Start test balloon error:", err);
        return error(res, err.message || "Erro ao iniciar teste de balão");
    }
}

export async function clearTestBalloon(req: Request, res: Response) {
    try {
        await prizeService.clearTestBalloon();
        return success(res, { ok: true });
    } catch (err: any) {
        console.error("Clear test balloon error:", err);
        return error(res, err.message || "Erro ao limpar teste de balão");
    }
}
