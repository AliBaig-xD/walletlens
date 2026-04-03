import { Router } from "express";
import { MonkePayExpress } from "@monkepay/sdk";
import { AnalyzeController } from "../controllers/analyze.controller.js";
import { optionalAuthenticate } from "../middleware/auth.js";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

const router = Router();
const ctrl = new AnalyzeController();

// trust proxy is set on the app — MonkePay needs it for correct IP detection
const monkePay = MonkePayExpress({
  apiKeyId: env.MONKEPAY_API_KEY_ID,
  apiKeySecret: env.MONKEPAY_API_KEY_SECRET,
  price: "0.10",
  onPayment: async (payment) => {
    ctrl.handlePayment(payment);
  },
  onError: async (error) => {
    logger.error("[MonkePay]", error.code, error.phase, error.message);
  },
});

// POST /api/v1/analyze — $0.10 per request
router.post("/analyze", optionalAuthenticate, monkePay({ price: '0.10' }), ctrl.analyze);

// POST /api/v1/transfers — $0.05 per request
router.post('/transfers', optionalAuthenticate, monkePay({ price: '0.05' }), ctrl.transfers);

export default router;
