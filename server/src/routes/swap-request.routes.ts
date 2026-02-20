import { Router } from "express";
import * as swapRequestController from "../controllers/swap-request.controller";

const router = Router();

router.get("/", swapRequestController.getOpenSwapRequests);
router.post("/", swapRequestController.createSwapRequest);
router.post("/:id/accept", swapRequestController.acceptSwapRequest);
router.delete("/:id", swapRequestController.cancelSwapRequest);

export default router;
