import { Request, Response, NextFunction } from "express";
import { AuthService, parseJwtDuration } from "../services/auth.service.js";
import {
  nonceQuerySchema,
  verifyBodySchema,
  refreshBodySchema,
} from "../schemas/auth.schema.js";
import { ApiError } from "../middleware/errors.js";
import { env } from "../../../config/env.js";

export class AuthController {
  private authService = new AuthService();

  private get cookieOptions() {
    return {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE as any,
      path: "/",
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    };
  }

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie("accessToken", accessToken, {
      ...this.cookieOptions,
      maxAge: parseJwtDuration(env.JWT_EXPIRES_IN),
    });
    res.cookie("refreshToken", refreshToken, {
      ...this.cookieOptions,
      maxAge: parseJwtDuration(env.JWT_REFRESH_EXPIRES_IN),
    });
  }

  private clearCookies(res: Response): void {
    res.clearCookie("accessToken", this.cookieOptions);
    res.clearCookie("refreshToken", this.cookieOptions);
  }

  getNonce = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { address } = nonceQuerySchema.parse(req.query);
      const nonce = await this.authService.generateNonce(address);
      res.json({ data: { nonce } });
    } catch (error) {
      next(error);
    }
  };

  verify = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = verifyBodySchema.parse(req.body);
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        null;
      const userAgent = req.headers["user-agent"] ?? null;

      const result = await this.authService.verifySignature({
        ...body,
        ipAddress,
        userAgent,
      });
      this.setCookies(res, result.token, result.refreshToken);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken =
        (req.cookies?.refreshToken as string | undefined) ??
        (refreshBodySchema.safeParse(req.body).success
          ? refreshBodySchema.parse(req.body).refreshToken
          : undefined);

      if (!refreshToken)
        throw new ApiError(400, "VALIDATION_ERROR", "Refresh token required");

      const result = await this.authService.refreshToken(refreshToken);
      this.setCookies(res, result.token, result.refreshToken);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.logout(req.user!.sessionId);
      this.clearCookies(res);
      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json({ data: { user: req.user } });
    } catch (error) {
      next(error);
    }
  };
}
