import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const ctrl = new ReportsController();

router.get("/", authenticate, ctrl.list);
router.get("/:id", authenticate, ctrl.get);
router.get("/:id/public", ctrl.getPublic); // No auth — used by /report/[id] page

export default router;
