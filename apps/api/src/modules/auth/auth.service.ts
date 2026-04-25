import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';
import {
  AUTH_PROFILE_ID_HEADER,
  AUTH_SESSION_ID_HEADER,
  AUTH_USER_ID_HEADER,
} from './auth.constants';
import type { AuthRequest, AuthRequestHeaders } from './auth-request.interface';
import type {
  ApiAuthContext,
  ApiAuthProfileSnapshot,
  ApiAuthSessionSnapshot,
  AuthenticatedApiAuthContext,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  getRequestContext(request: Pick<AuthRequest, 'headers'>): ApiAuthContext {
    const profileId = this.readHeader(request.headers, AUTH_PROFILE_ID_HEADER);

    if (!profileId) {
      return {
        isAuthenticated: false,
        strategy: 'anonymous',
      };
    }

    return {
      isAuthenticated: true,
      strategy: 'profile-header',
      profileId,
      sessionId: this.readHeader(request.headers, AUTH_SESSION_ID_HEADER),
      userId: this.readHeader(request.headers, AUTH_USER_ID_HEADER),
    };
  }

  requireAuthenticatedContext(
    authContext: ApiAuthContext | undefined,
  ): AuthenticatedApiAuthContext {
    if (!authContext?.isAuthenticated) {
      throw new UnauthorizedException('Unauthorized');
    }

    return authContext;
  }

  async getSessionSnapshot(
    authContext: ApiAuthContext | undefined,
  ): Promise<ApiAuthSessionSnapshot> {
    if (!authContext?.isAuthenticated) {
      return {
        isAuthenticated: false,
        strategy: 'anonymous',
        sessionId: null,
        profile: null,
        user: null,
      };
    }

    const profile = await this.getProfileSnapshot(authContext.profileId);

    if (!profile) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      isAuthenticated: true,
      strategy: authContext.strategy,
      sessionId: authContext.sessionId ?? null,
      profile,
      user: {
        id: profile.userId,
        displayName: profile.name,
        email: profile.email,
        imageUrl: profile.imageUrl,
      },
    };
  }

  async getProfileSnapshot(profileId: string): Promise<ApiAuthProfileSnapshot | null> {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      imageUrl: profile.imageUrl,
    };
  }

  private readHeader(
    headers: AuthRequestHeaders,
    headerName: string,
  ): string | undefined {
    const value = headers[headerName];

    if (Array.isArray(value)) {
      return value[0]?.trim() || undefined;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    const resolvedValue = value.trim();

    return resolvedValue.length > 0 ? resolvedValue : undefined;
  }
}
