import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { strictRateLimiter } from "../middleware/rateLimit.js";

const router = Router();
const ctrl = new AuthController();

router.get("/nonce", strictRateLimiter, ctrl.getNonce);
router.post("/verify", strictRateLimiter, ctrl.verify);
router.post("/refresh", ctrl.refresh);
router.post("/logout", authenticate, ctrl.logout);
router.get("/me", authenticate, ctrl.me);

export default router;
