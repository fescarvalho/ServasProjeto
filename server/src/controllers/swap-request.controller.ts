import { Request, Response } from "express";
import * as swapRequestService from "../services/swap-request.service";
import { success, error } from "../utils/response.utils";

/**
 * GET /swap-requests — list all open swap requests
 */
export async function getOpenSwapRequests(req: Request, res: Response) {
    try {
        const requests = await swapRequestService.getOpenSwapRequests();
        return success(res, requests);
    } catch (err) {
        console.error("Get swap requests error:", err);
        return error(res, "Erro ao buscar pedidos de substituição.");
    }
}

/**
 * POST /swap-requests — create a swap request
 * Body: { signupId, requesterId }
 */
export async function createSwapRequest(req: Request, res: Response) {
    try {
        const { signupId, requesterId } = req.body;
        const result = await swapRequestService.createSwapRequest(signupId, requesterId);
        return success(res, result);
    } catch (err: any) {
        console.error("Create swap request error:", err);
        return error(res, err.message || "Erro ao criar pedido de substituição.");
    }
}

/**
 * POST /swap-requests/:id/accept — accept and execute a swap
 * Body: { acceptorId }
 */
export async function acceptSwapRequest(req: Request, res: Response) {
    try {
        const id = String(req.params.id);
        const { acceptorId } = req.body;
        const result = await swapRequestService.acceptSwapRequest(id, acceptorId);
        return success(res, result);
    } catch (err: any) {
        console.error("Accept swap request error:", err);
        return error(res, err.message || "Erro ao aceitar substituição.");
    }
}

/**
 * DELETE /swap-requests/:id — cancel a swap request
 * Body: { userId }
 */
export async function cancelSwapRequest(req: Request, res: Response) {
    try {
        const id = String(req.params.id);
        const { userId } = req.body;
        const result = await swapRequestService.cancelSwapRequest(id, userId);
        return success(res, result);
    } catch (err: any) {
        console.error("Cancel swap request error:", err);
        return error(res, err.message || "Erro ao cancelar pedido de substituição.");
    }
}
