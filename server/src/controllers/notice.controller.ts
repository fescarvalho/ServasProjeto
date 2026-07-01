import { Request, Response } from "express";
import * as noticeService from "../services/notice.service";
import { success, error } from "../utils/response.utils";
import { HTTP_STATUS } from "../constants";

/**
 * Get active notices
 */
export async function getNotices(req: Request, res: Response) {
    try {
        const notices = await noticeService.getActiveNotices();
        return success(res, notices);
    } catch (err) {
        console.error("Get notices error:", err);
        return error(res, "Error fetching notices");
    }
}

/**
 * Create a new notice
 */
export async function createNotice(req: Request, res: Response) {
    try {
        const { text } = req.body;
        const notice = await noticeService.createNotice(text);
        return success(res, notice, HTTP_STATUS.CREATED);
    } catch (err) {
        console.error("Create notice error:", err);
        return error(res, "Error creating notice");
    }
}

/**
 * Delete a notice
 */
export async function deleteNotice(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await noticeService.deleteNotice(String(id));
        return success(res, { success: true });
    } catch (err) {
        console.error("Delete notice error:", err);
        return error(res, "Error deleting notice");
    }
}

/**
 * Trigger the creation of the monthly champion notice via cron
 */
export async function postMonthlyChampion(req: Request, res: Response) {
    try {
        const result = await noticeService.postMonthlyChampionNotice();
        if (result.success) {
            return success(res, result, HTTP_STATUS.CREATED);
        } else {
            // Can be a 200 OK since the job ran fine, but just didn't create anything (e.g. already exists)
            return success(res, result);
        }
    } catch (err) {
        console.error("Post monthly champion error:", err);
        return error(res, "Error posting monthly champion notice");
    }
}
