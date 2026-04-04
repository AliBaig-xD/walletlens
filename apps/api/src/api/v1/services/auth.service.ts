import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import { generateNonce, verifyAndConsumeNonce } from "../../../utils/siwe.js";
import { ApiError } from "../middleware/errors.js";
import { env } from "../../../config/env.js";

// ─── JWT helpers (exported for use in auth middleware) ─────────────────────────

export interface JwtPayload {
  userId: number;
  walletAddress: string;
  sessionId: number;
  role: string;
}

export function parseJwtDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match?.[1] || !match?.[2])
    throw new Error(`Invalid JWT duration: ${duration}`);
  const num = parseInt(match[1], 10);
  const units: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  return num * units[match[2]]!;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: "walletlens",
    audience: "walletlens-api",
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "walletlens",
    audience: "walletlens-api",
  }) as JwtPayload;
}

// ─── Auth service ──────────────────────────────────────────────────────────────

export class AuthService {
  async generateNonce(address: string): Promise<string> {
    return generateNonce(address);
  }

  async verifySignature(data: {
    message: string;
    signature: string;
    address: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    // 1. Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(data.message, data.signature);
    } catch {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid signature");
    }

    if (recoveredAddress.toLowerCase() !== data.address.toLowerCase()) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Signature does not match address",
      );
    }

    // 2. Extract and verify nonce
    const nonceMatch = data.message.match(/Nonce:\s*([0-9a-fA-F-]+)/i);
    if (!nonceMatch?.[1]) {
      throw new ApiError(400, "VALIDATION_ERROR", "Nonce not found in message");
    }

    const valid = await verifyAndConsumeNonce(data.address, nonceMatch[1]);
    if (!valid)
      throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired nonce");

    // 3. Find or create user (claims orphaned reports on first login)
    const user = await this.findOrCreateUser(data.address);

    // 4. Create session
    const session = await this.createSession(
      user.id,
      data.address,
      data.ipAddress,
      data.userAgent,
    );

    // 5. Generate JWT
    const token = generateToken({
      userId: user.id,
      walletAddress: data.address.toLowerCase(),
      sessionId: session.id,
      role: user.role,
    });

    return {
      token,
      refreshToken: session.refreshToken!,
      user: this.formatUser(user),
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
        refreshTokenExpiresAt:
          session.refreshTokenExpiresAt?.toISOString() ?? null,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session)
      throw new ApiError(401, "UNAUTHORIZED", "Invalid refresh token");

    if (
      !session.refreshTokenExpiresAt ||
      session.refreshTokenExpiresAt < new Date()
    ) {
      await prisma.userSession.delete({ where: { id: session.id } });
      throw new ApiError(401, "UNAUTHORIZED", "Refresh token expired");
    }

    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const newExpiry = new Date(
      Date.now() + parseJwtDuration(env.JWT_REFRESH_EXPIRES_IN),
    );

    // updateMany with old token as guard — prevents concurrent reuse
    const result = await prisma.userSession.updateMany({
      where: { id: session.id, refreshToken },
      data: {
        sessionToken: uuidv4(),
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newExpiry,
        expiresAt: newExpiry,
      },
    });

    if (result.count === 0) {
      throw new ApiError(401, "UNAUTHORIZED", "Refresh token already used");
    }

    const token = generateToken({
      userId: session.user.id,
      walletAddress: session.user.walletAddress,
      sessionId: session.id,
      role: session.user.role,
    });

    return { token, refreshToken: newRefreshToken };
  }

  async logout(sessionId: number) {
    await prisma.userSession.delete({ where: { id: sessionId } });
    return { success: true };
  }

  private async findOrCreateUser(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { walletAddress: normalized },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: normalized, role: "USER" },
      });

      // Claim any reports generated by an agent before this wallet signed up
      const claimed = await prisma.report.updateMany({
        where: { agentAddress: normalized, userId: null },
        data: { userId: user.id },
      });

      logger.info("New user created", {
        userId: user.id,
        walletAddress: normalized,
        claimedReports: claimed.count,
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return user;
  }

  private async createSession(
    userId: number,
    walletAddress: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const expiresAt = new Date(
      Date.now() + parseJwtDuration(env.JWT_EXPIRES_IN),
    );
    const refreshExpiry = new Date(
      Date.now() + parseJwtDuration(env.JWT_REFRESH_EXPIRES_IN),
    );

    return prisma.userSession.create({
      data: {
        userId,
        walletAddress: walletAddress.toLowerCase(),
        sessionToken: uuidv4(),
        refreshToken: crypto.randomBytes(32).toString("hex"),
        refreshTokenExpiresAt: refreshExpiry,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
      },
    });
  }

  private formatUser(user: {
    id: number;
    walletAddress: string;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
