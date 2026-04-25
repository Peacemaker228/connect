import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';
import {
  AUTH_AUTHORIZATION_HEADER,
  AUTH_PROFILE_ID_HEADER,
  AUTH_SESSION_ID_HEADER,
  AUTH_USER_ID_HEADER,
} from './auth.constants';
import type { AuthRequest, AuthRequestHeaders } from './auth-request.interface';
import { AuthTokensService } from './auth-tokens.service';
import type {
  ApiAuthContext,
  ApiAuthIdentityPayload,
  ApiAuthProfileSnapshot,
  ApiAuthSessionExchangeSnapshot,
  ApiAuthSessionSnapshot,
  AuthenticatedApiAuthContext,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokensService: AuthTokensService,
  ) {}

  getRequestContext(request: Pick<AuthRequest, 'headers'>): ApiAuthContext {
    const authorizationHeader = this.readHeader(
      request.headers,
      AUTH_AUTHORIZATION_HEADER,
    );

    if (authorizationHeader) {
      const bearerToken = this.readBearerToken(authorizationHeader);
      const tokenPayload = this.authTokensService.verifyAccessToken(bearerToken);

      return {
        isAuthenticated: true,
        strategy: 'access-token',
        profileId: tokenPayload.profileId,
        sessionId: tokenPayload.sessionId,
        userId: tokenPayload.userId,
      };
    }

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

  async exchangeSession(
    authContext: ApiAuthContext | undefined,
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const currentSession = await this.getSessionSnapshot(
      this.requireAuthenticatedContext(authContext),
    );

    if (!currentSession.profile) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      session: currentSession,
      issuedSession: this.authTokensService.issueSessionTokens({
        profileId: currentSession.profile.id,
        userId: currentSession.profile.userId,
        sessionId: currentSession.sessionId,
      }),
    };
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

  async refreshSession(
    refreshToken: string | undefined,
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const refreshTokenPayload = this.authTokensService.verifyRefreshToken(refreshToken);
    const profile = await this.getProfileSnapshot(refreshTokenPayload.profileId);

    if (!profile || profile.userId !== refreshTokenPayload.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      session: this.createSessionSnapshot(
        profile,
        'access-token',
        refreshTokenPayload.sessionId,
      ),
      issuedSession: this.authTokensService.issueSessionTokens({
        profileId: profile.id,
        userId: profile.userId,
        sessionId: refreshTokenPayload.sessionId,
      }),
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
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async resolveSessionFromIdentity(params: {
    userId?: string;
    sessionId?: string;
    identity?: ApiAuthIdentityPayload;
  }): Promise<ApiAuthSessionSnapshot> {
    const resolvedUserId = params.userId ?? params.identity?.id;

    if (!resolvedUserId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (params.identity && params.identity.id !== resolvedUserId) {
      throw new BadRequestException('Auth user mismatch');
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: {
        userId: resolvedUserId,
      },
    });

    if (existingProfile) {
      return this.createSessionSnapshot(existingProfile, 'user-header', params.sessionId);
    }

    if (!params.identity) {
      throw new NotFoundException('Profile not found');
    }

    const createdProfile = await this.prisma.profile.upsert({
      where: {
        userId: resolvedUserId,
      },
      update: {},
      create: {
        userId: resolvedUserId,
        name: this.getProfileName(params.identity),
        imageUrl: params.identity.imageUrl ?? '',
        email: params.identity.primaryEmailAddress ?? '',
      },
    });

    return this.createSessionSnapshot(createdProfile, 'user-header', params.sessionId);
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

  private readBearerToken(authorizationHeader: string) {
    const [scheme, token] = authorizationHeader.split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }

  private createSessionSnapshot(
    profile: {
      id: string;
      userId: string;
      name: string;
      email: string;
      imageUrl: string;
      createdAt: Date;
      updatedAt: Date;
    },
    strategy: ApiAuthSessionSnapshot['strategy'],
    sessionId?: string,
  ): ApiAuthSessionSnapshot {
    return {
      isAuthenticated: true,
      strategy,
      sessionId: sessionId ?? null,
      profile: {
        id: profile.id,
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        imageUrl: profile.imageUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      user: {
        id: profile.userId,
        displayName: profile.name,
        email: profile.email,
        imageUrl: profile.imageUrl,
      },
    };
  }

  private getProfileName(identity: ApiAuthIdentityPayload) {
    if (identity.firstName && identity.lastName) {
      return `${identity.firstName} ${identity.lastName}`;
    }

    if (identity.firstName) {
      return identity.firstName;
    }

    if (identity.lastName) {
      return identity.lastName;
    }

    if (identity.username) {
      return identity.username;
    }

    return 'USER';
  }
}
