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
