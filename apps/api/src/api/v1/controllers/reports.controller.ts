import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/db.js";
import { ApiError } from "../middleware/errors.js";
import {
  buildPaginatedResponse,
  validatePaginationParams,
  calculateOffset,
} from "../../../utils/pagination.js";
import {
  reportParamSchema,
  reportsQuerySchema,
} from "../schemas/reports.schema.js";

export class ReportsController {
  // GET /api/v1/reports — paginated list for authenticated user
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = reportsQuerySchema.parse(req.query);
      const { page, limit } = validatePaginationParams(query.page, query.limit);
      const skip = calculateOffset(page, limit);

      const [total, reports] = await Promise.all([
        prisma.report.count({ where: { userId: req.user!.userId } }),
        prisma.report.findMany({
          where: { userId: req.user!.userId },
          select: {
            id: true,
            address: true,
            reportType: true,
            summary: true,
            txHash: true,
            amountPaid: true,
            network: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      const serialized = reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));

      const response = buildPaginatedResponse(serialized, page, limit, total);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/reports/:id — single report for authenticated user
  get = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = reportParamSchema.parse(req.params);

      const report = await prisma.report.findUnique({ where: { id } });
      if (!report) throw new ApiError(404, "NOT_FOUND", "Report not found");
      if (report.userId !== req.user!.userId)
        throw new ApiError(403, "FORBIDDEN", "Not your report");

      res.json({
        data: {
          ...report,
          createdAt: report.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
