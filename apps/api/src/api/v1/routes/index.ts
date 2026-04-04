import { Router } from "express";
import authRoutes from './auth.js';
import analyzeRoutes from "./analyze.js";
import reportsRoutes from "./reports.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", analyzeRoutes); // /analyze, /transfers, /report
router.use("/reports", reportsRoutes);

export default router;
