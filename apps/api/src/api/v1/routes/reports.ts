import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const ctrl = new ReportsController();

router.get("/", authenticate, ctrl.list);
router.get("/:id", authenticate, ctrl.get);

export default router;
