import { Router } from "express";
import authRoutes from './auth.js';
import analyzeRoutes from "./analyze.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", analyzeRoutes); // /analyze, /transfers, /report

export default router;
