import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import {
  analyzeBodySchema,
  transfersBodySchema,
} from "../schemas/analyze.schema.js";
import {
  getAddressEnriched,
  getAddressTransfers,
  getEntitySummary,
} from "../services/arkham.service.js";
import { generateSummary } from "../services/summarize.service.js";
import type { PaymentEvent } from "@monkepay/sdk";
import { formatIntel, formatTransfers } from "../../../utils/arkham.util.js";
import { env } from "../../../config/env.js";

export class AnalyzeController {
  // Short-lived store for onPayment events
  // Keyed by agentAddress — populated by MonkePay onPayment callback
  // Simple and reliable — no header parsing guesswork
  private recentPayments: PaymentEvent[] = [];

  handlePayment(payment: PaymentEvent): void {
    this.recentPayments.push(payment);
    // Clean up payments older than 2 minutes
    const cutoff = Date.now() - 2 * 60 * 1000;
    this.recentPayments = this.recentPayments.filter(
      (p) => new Date(p.timestamp).getTime() > cutoff,
    );
  }

  // Get the most recent payment — close enough for hackathon linkage
  private popRecentPayment(): PaymentEvent | undefined {
    return this.recentPayments.pop();
  }

  analyze = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { address } = analyzeBodySchema.parse(req.body);

      logger.info("Analyze request", {
        address,
        userId: req.user?.userId ?? "anon",
      });

      // Fire all three Arkham calls in parallel
      const [intel, transfers] = await Promise.all([
        getAddressEnriched(address),
        getAddressTransfers(address, "24h"),
      ]);

      // If we have a known entity, get its summary in parallel with Claude
      const entityId = intel.arkhamEntity?.id ?? null;
      const entitySummary = entityId ? await getEntitySummary(entityId) : null;

      const summary = await generateSummary(
        address,
        intel,
        transfers,
        entitySummary,
      );

      const formattedIntel = formatIntel(intel);
      const formattedTransfers = formatTransfers(transfers);

      const payment = this.popRecentPayment();

      await prisma.report.create({
        data: {
          userId: req.user?.userId ?? null,
          agentAddress:
            payment?.agentAddress?.toLowerCase() ??
            req.user?.walletAddress?.toLowerCase() ??
            null,
          address: address.toLowerCase(),
          reportType: "analyze",
          summary,
          result: {
            intel: formattedIntel,
            transfers: formattedTransfers,
          } as any,
          txHash: payment?.txHash ?? null,
          amountPaid: payment?.amountUSDC ?? null,
          network: env.NETWORK,
        },
      });

      res.json({
        data: {
          ...formattedIntel,
          summary,
          transfers: formattedTransfers,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  transfers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { address, timeLast } = transfersBodySchema.parse(req.body);

      logger.info("Transfers request", { address, timeLast });

      const data = await getAddressTransfers(address, timeLast);
      const formatted = formatTransfers(data);

      res.json({
        data: {
          address,
          timeLast,
          ...formatted,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
