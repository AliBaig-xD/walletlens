import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import {
  analyzeBodySchema,
  transfersBodySchema,
  reportBodySchema,
} from "../schemas/analyze.schema.js";
import {
  getAddressEnriched,
  getAddressTransfers,
  getEntitySummary,
} from "../services/arkham.service.js";
import {
  generateSummary,
  generateReportMarkdown,
} from "../services/summarize.service.js";
import type { PaymentEvent } from "@monkepay/sdk";
import {
  formatIntel,
  formatTransfers,
  isArkhamCached,
} from "../../../utils/arkham.util.js";
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
      const addressLower = address.toLowerCase();
      const reuseSince = new Date(
        Date.now() - env.ARKHAM_CACHE_TTL_SECONDS * 1000,
      );

      logger.info("Analyze request", {
        address,
        userId: req.user?.userId ?? "anon",
      });

      const [hasEnrichedCache, hasTransfersCache] = await Promise.all([
        isArkhamCached(`enriched:${addressLower}`),
        isArkhamCached(`transfers:${addressLower}:24h`),
      ]);

      if (hasEnrichedCache && hasTransfersCache) {
        const cached = await prisma.report.findFirst({
          where: {
            address: addressLower,
            reportType: "analyze",
            summary: { not: null },
            createdAt: { gte: reuseSince },
          },
          orderBy: { createdAt: "desc" },
        });

        const cachedResult = cached?.result as any;
        const cachedIntel = cachedResult?.intel;
        const cachedTransfers = cachedResult?.transfers;

        if (cached && cached.summary && cachedIntel && cachedTransfers) {
          logger.info("Analyze reuse from cache", { address });
          this.popRecentPayment();
          res.json({
            data: {
              ...cachedIntel,
              summary: cached.summary,
              transfers: cachedTransfers,
              generatedAt: cached.createdAt.toISOString(),
            },
          });
          return;
        }
      }

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
          address: addressLower,
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
      const addressLower = address.toLowerCase();
      const reuseSince = new Date(
        Date.now() - env.ARKHAM_CACHE_TTL_SECONDS * 1000,
      );

      logger.info("Transfers request", { address, timeLast });

      const hasTransfersCache = await isArkhamCached(
        `transfers:${addressLower}:${timeLast}`,
      );

      if (hasTransfersCache) {
        const cached = await prisma.report.findFirst({
          where: {
            address: addressLower,
            reportType: "transfers",
            createdAt: { gte: reuseSince },
          },
          orderBy: { createdAt: "desc" },
        });

        const cachedResult = cached?.result as any;
        const cachedTransfers = cachedResult?.transfers;
        const cachedTimeLast = cachedResult?.timeLast;

        if (cached && cachedTransfers && cachedTimeLast === timeLast) {
          logger.info("Transfers reuse from cache", { address, timeLast });
          this.popRecentPayment();
          res.json({
            data: {
              address,
              timeLast,
              ...cachedTransfers,
              generatedAt: cached.createdAt.toISOString(),
            },
          });
          return;
        }
      }

      const data = await getAddressTransfers(address, timeLast);
      const formatted = formatTransfers(data);

      const payment = this.popRecentPayment();

      await prisma.report.create({
        data: {
          userId: req.user?.userId ?? null,
          agentAddress:
            payment?.agentAddress?.toLowerCase() ??
            req.user?.walletAddress?.toLowerCase() ??
            null,
          address: addressLower,
          reportType: "transfers",
          summary: null,
          result: { transfers: formatted, timeLast } as any,
          txHash: payment?.txHash ?? null,
          amountPaid: payment?.amountUSDC ?? null,
          network: env.NETWORK,
        },
      });

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

  report = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { address } = reportBodySchema.parse(req.body);
      const addressLower = address.toLowerCase();
      const reuseSince = new Date(
        Date.now() - env.ARKHAM_CACHE_TTL_SECONDS * 1000,
      );

      logger.info("Report request", {
        address,
        userId: req.user?.userId ?? "anon",
      });

      const [hasEnrichedCache, hasTransfersCache] = await Promise.all([
        isArkhamCached(`enriched:${addressLower}`),
        isArkhamCached(`transfers:${addressLower}:24h`),
      ]);

      if (hasEnrichedCache && hasTransfersCache) {
        const cached = await prisma.report.findFirst({
          where: {
            address: addressLower,
            reportType: "report",
            summary: { not: null },
            markdown: { not: null },
            createdAt: { gte: reuseSince },
          },
          orderBy: { createdAt: "desc" },
        });

        const cachedResult = cached?.result as any;
        const cachedIntel = cachedResult?.intel;

        if (cached && cached.summary && cached.markdown && cachedIntel) {
          logger.info("Report reuse from cache", { address });
          this.popRecentPayment();
          res.json({
            data: {
              reportId: cached.id,
              ...cachedIntel,
              summary: cached.summary,
              reportUrl: `https://walletlens.online/report/${cached.id}`,
              generatedAt: cached.createdAt.toISOString(),
            },
          });
          return;
        }
      }

      const [intel, transfers] = await Promise.all([
        getAddressEnriched(address),
        getAddressTransfers(address, "24h"),
      ]);

      const entityId = intel.arkhamEntity?.id ?? null;
      const entitySummary = entityId ? await getEntitySummary(entityId) : null;

      const summary = await generateSummary(
        address,
        intel,
        transfers,
        entitySummary,
      );
      const markdown = await generateReportMarkdown(
        address,
        intel,
        transfers,
        entitySummary,
        summary,
      );

      const formattedIntel = formatIntel(intel);
      const payment = this.popRecentPayment();

      const report = await prisma.report.create({
        data: {
          userId: req.user?.userId ?? null,
          agentAddress:
            payment?.agentAddress?.toLowerCase() ??
            req.user?.walletAddress?.toLowerCase() ??
            null,
          address: addressLower,
          reportType: "report",
          summary,
          result: { intel: formattedIntel } as any,
          markdown,
          txHash: payment?.txHash ?? null,
          amountPaid: payment?.amountUSDC ?? null,
          network: env.NETWORK,
        },
      });

      res.json({
        data: {
          reportId: report.id,
          ...formattedIntel,
          summary,
          reportUrl: `https://walletlens.online/report/${report.id}`,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
