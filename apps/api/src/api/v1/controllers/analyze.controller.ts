import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import { analyzeBodySchema } from "../schemas/analyze.schema.js";
import {
  getAddressEnriched,
  getAddressTransfers,
  getEntitySummary,
} from "../services/arkham.service.js";
import { generateSummary } from "../services/summarize.service.js";
import { formatIntel, formatTransfers } from "../../../utils/arkham.util.js";
import { env } from "../../../config/env.js";

export class AnalyzeController {
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

      await prisma.report.create({
        data: {
          userId: req.user?.userId ?? null,
          agentAddress: req.user?.walletAddress?.toLowerCase() ?? null,
          address: address.toLowerCase(),
          reportType: "analyze",
          summary,
          result: {
            intel: formattedIntel,
            transfers: formattedTransfers,
          } as any,
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
}
