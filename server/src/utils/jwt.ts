import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: Role;
  email: string;
  tokenId?: string;
}

export class JwtUtil {
  static signAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRY as any,
      }
    );
  }

  static signRefreshToken(payload: TokenPayload, familyId: string): { token: string; tokenId: string; familyId: string } {
    const tokenId = crypto.randomUUID();
    const token = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        tokenId,
        familyId,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRY as any,
      }
    );
    return { token, tokenId, familyId };
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload & { tokenId: string; familyId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & { tokenId: string; familyId: string };
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
