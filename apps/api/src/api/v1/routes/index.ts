import { Router } from "express";
import analyzeRoutes from "./analyze.js";

const router = Router();

router.use("/", analyzeRoutes); // /analyze, /transfers, /report

export default router;
