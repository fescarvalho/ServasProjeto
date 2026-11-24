import { Request, Response } from "express";
import * as massService from "../services/mass.service";
import { success, error } from "../utils/response.utils";
import { HTTP_STATUS } from "../constants";

/**
 * Get all masses
 */
export async function getMasses(req: Request, res: Response) {
    try {
        const masses = await massService.getAllMasses();
        return success(res, masses);
    } catch (err) {
        console.error("Get masses error:", err);
        return error(res, "Error fetching masses");
    }
}

/**
 * Create a new mass
 */
export async function createMass(req: Request, res: Response) {
    try {
        const mass = await massService.createMass(req.body);
        return success(res, mass, HTTP_STATUS.CREATED);
    } catch (err) {
        console.error("Create mass error:", err);
        return error(res, "Error creating mass");
    }
}

/**
 * Update a mass
 */
export async function updateMass(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const mass = await massService.updateMass(String(id), req.body);
        return success(res, mass);
    } catch (err) {
        console.error("Update mass error:", err);
        return error(res, "Error updating mass");
    }
}

/**
 * Delete a mass
 */
export async function deleteMass(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await massService.deleteMass(String(id));
        return success(res, { status: "deleted" });
    } catch (err) {
        console.error("Delete mass error:", err);
        return error(res, "Error deleting mass");
    }
}

/**
 * Patch mass (generic update)
 */
export async function patchMass(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const mass = await massService.patchMass(String(id), req.body);
        return success(res, mass);
    } catch (err) {
        console.error("Patch mass error:", err);
        return error(res, "Error updating mass status");
    }
}

/**
 * Toggle open status
 */
export async function toggleOpen(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { open } = req.body;
        const mass = await massService.toggleOpen(String(id), open);
        return success(res, mass);
    } catch (err) {
        console.error("Toggle open error:", err);
        return error(res, "Error toggling mass open status");
    }
}

/**
 * Get mass team photo (on-demand)
 */
export async function getMassPhoto(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const photo = await massService.getMassPhoto(String(id));
        if (!photo) {
            return res.status(404).json({ error: "Nenhuma foto encontrada para esta missa (ou já expirou após 30 dias)." });
        }
        return success(res, photo);
    } catch (err: any) {
        console.error("Get mass photo error:", err);
        return error(res, err.message || "Erro ao buscar foto da missa");
    }
}

/**
 * Upload mass team photo (escalated server on the day of mass or ADMIN)
 */
export async function uploadMassPhoto(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { imageDataUrl, capturedAt } = req.body || {};
        if (!req.userId) {
            return res.status(401).json({ error: "Não autenticado." });
        }
        const result = await massService.saveMassPhoto(
            String(id),
            String(req.userId),
            imageDataUrl,
            typeof capturedAt === "string" ? capturedAt : undefined
        );
        return success(res, result);
    } catch (err: any) {
        console.error("Upload mass photo error:", err);
        return error(res, err.message || "Erro ao enviar foto da equipe");
    }
}

/**
 * Delete mass team photo (ADMIN only)
 */
export async function deleteMassPhoto(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await massService.deleteMassPhoto(String(id));
        return success(res, { deleted: true });
    } catch (err: any) {
        console.error("Delete mass photo error:", err);
        return error(res, err.message || "Erro ao remover foto da missa");
    }
}

/**
 * Confirm presence for all confirmed servers in a mass (ADMIN only)
 */
export async function confirmAllPresence(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = await massService.confirmAllMassPresence(String(id));
        return success(res, result);
    } catch (err: any) {
        console.error("Confirm all presence error:", err);
        return error(res, err.message || "Erro ao confirmar presença da equipe");
    }
}
