import { Router } from "express";
import { AnalyzeController } from "../controllers/analyze.controller.js";
import { optionalAuthenticate } from "../middleware/auth.js";

const router = Router();
const ctrl = new AnalyzeController();

// POST /api/v1/analyze
router.post("/analyze", optionalAuthenticate, ctrl.analyze);

export default router;
