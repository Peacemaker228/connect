import { Injectable } from '@nestjs/common';
import { AuthSessionStatus } from '@prisma/client';
import { createHash } from 'crypto';

import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class AuthSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: {
    sessionId: string;
    profileId: string;
    userId: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.authSession.create({
      data: {
        id: params.sessionId,
        profileId: params.profileId,
        userId: params.userId,
        refreshTokenHash: this.hashRefreshToken(params.refreshToken),
        refreshTokenExpiresAt: params.refreshTokenExpiresAt,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
      },
    });
  }

  async touchSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        status: AuthSessionStatus.ACTIVE,
        revokedAt: null,
      },
      data: {
        lastAccessedAt: new Date(),
      },
    });
  }

  async validateSession(params: {
    sessionId: string;
    profileId: string;
    userId: string;
  }) {
    const session = await this.prisma.authSession.findUnique({
      where: {
        id: params.sessionId,
      },
    });

    if (!session) {
      return null;
    }

    if (
      session.status !== AuthSessionStatus.ACTIVE ||
      session.revokedAt ||
      session.profileId !== params.profileId ||
      session.userId !== params.userId ||
      session.refreshTokenExpiresAt <= new Date()
    ) {
      return null;
    }

    return session;
  }

  async validateRefreshSession(params: {
    sessionId: string;
    profileId: string;
    userId: string;
    refreshToken: string;
  }) {
    const session = await this.validateSession(params);

    if (!session) {
      return null;
    }

    return session.refreshTokenHash === this.hashRefreshToken(params.refreshToken)
      ? session
      : null;
  }

  async rotateSession(params: {
    sessionId: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.authSession.update({
      where: {
        id: params.sessionId,
      },
      data: {
        refreshTokenHash: this.hashRefreshToken(params.refreshToken),
        refreshTokenExpiresAt: params.refreshTokenExpiresAt,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        lastAccessedAt: new Date(),
      },
    });
  }

  async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        status: AuthSessionStatus.ACTIVE,
        revokedAt: null,
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
