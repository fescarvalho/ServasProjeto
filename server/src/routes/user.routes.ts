import { Router } from "express";
import * as userController from "../controllers/user.controller";

const router = Router();

router.get("/list", userController.getUsersList);

export default router;
