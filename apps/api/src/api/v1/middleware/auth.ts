import { Request, Response, NextFunction } from "express";
import { verifyToken, parseJwtDuration } from "../services/auth.service.js";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import { ApiError } from "./errors.js";
import { env } from "../../../config/env.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token = req.cookies?.accessToken as string | undefined;
    const usingCookies = !!token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(
          401,
          "UNAUTHORIZED",
          "No authorization token provided",
        );
      }
      token = authHeader.substring(7);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      if (usingCookies && req.cookies?.refreshToken) {
        try {
          const { AuthService } = await import("../services/auth.service.js");
          const authService = new AuthService();
          const result = await authService.refreshToken(
            req.cookies.refreshToken as string,
          );
          const opts = {
            httpOnly: true,
            secure: env.COOKIE_SECURE,
            sameSite: env.COOKIE_SAME_SITE as any,
            path: "/",
            ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
          };
          res.cookie("accessToken", result.token, {
            ...opts,
            maxAge: parseJwtDuration(env.JWT_EXPIRES_IN),
          });
          res.cookie("refreshToken", result.refreshToken, {
            ...opts,
            maxAge: parseJwtDuration(env.JWT_REFRESH_EXPIRES_IN),
          });
          payload = verifyToken(result.token);
        } catch {
          throw new ApiError(
            401,
            "UNAUTHORIZED",
            "Session expired, please sign in again",
          );
        }
      } else {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
      }
    }

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      select: {
        walletAddress: true,
        expiresAt: true,
        user: { select: { id: true, role: true } },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new ApiError(401, "UNAUTHORIZED", "Session expired");
    }

    if (
      session.walletAddress.toLowerCase() !==
      payload.walletAddress.toLowerCase()
    ) {
      throw new ApiError(401, "UNAUTHORIZED", "Session wallet mismatch");
    }

    req.user = {
      id: payload.userId,
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      sessionId: payload.sessionId,
      role: session.user.role,
    };

    logger.debug("User authenticated", { userId: req.user.userId });
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      (req.cookies?.accessToken as string | undefined) ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.substring(7)
        : undefined);

    if (!token) return next();

    try {
      const payload = verifyToken(token);
      const session = await prisma.userSession.findUnique({
        where: { id: payload.sessionId },
        select: {
          walletAddress: true,
          expiresAt: true,
          user: { select: { id: true, role: true } },
        },
      });

      if (
        session &&
        session.expiresAt > new Date() &&
        session.walletAddress.toLowerCase() ===
          payload.walletAddress.toLowerCase()
      ) {
        req.user = {
          id: payload.userId,
          userId: payload.userId,
          walletAddress: payload.walletAddress,
          sessionId: payload.sessionId,
          role: session.user.role,
        };
      }
    } catch {
      // Invalid token — continue without auth
    }
  } catch {
    // Continue without auth
  }
  next();
}
