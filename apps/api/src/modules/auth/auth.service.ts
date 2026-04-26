import {
  BadRequestException,
  Injectable,
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
import { AuthCookiesService } from './auth-cookies.service';
import { AuthIdentitiesService } from './auth-identities.service';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthTokensService } from './auth-tokens.service';
import type {
  ApiAuthContext,
  ApiAuthIdentityPayload,
  ApiAuthPasswordLoginPayload,
  ApiAuthPasswordRegistrationPayload,
  ApiAuthProfileSnapshot,
  ApiAuthSessionExchangeSnapshot,
  ApiAuthSessionSnapshot,
  AuthenticatedApiAuthContext,
} from './auth.types';

type AuthClientMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokensService: AuthTokensService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly authCookiesService: AuthCookiesService,
    private readonly authIdentitiesService: AuthIdentitiesService,
  ) {}

  async getRequestContext(
    request: Pick<AuthRequest, 'headers'>,
  ): Promise<ApiAuthContext> {
    const authorizationHeader = this.readHeader(
      request.headers,
      AUTH_AUTHORIZATION_HEADER,
    );

    if (authorizationHeader) {
      const bearerToken = this.readBearerToken(authorizationHeader);

      return this.resolveAccessTokenContext(bearerToken);
    }

    const cookieAccessToken = this.authCookiesService.getAccessTokenFromHeaders(
      request.headers,
    );

    if (cookieAccessToken) {
      try {
        return await this.resolveAccessTokenContext(cookieAccessToken);
      } catch (error) {
        if (!(error instanceof UnauthorizedException)) {
          throw error;
        }
      }
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
    metadata: AuthClientMetadata = {},
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const currentSession = await this.getSessionSnapshot(
      this.requireAuthenticatedContext(authContext),
    );

    if (!currentSession.profile) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.issueOwnedSession(currentSession.profile, metadata);
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

    return this.createSessionSnapshot(
      profile,
      authContext.strategy,
      authContext.sessionId,
    );
  }

  async refreshSession(params: {
    refreshToken?: string;
    cookieHeader?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<ApiAuthSessionExchangeSnapshot> {
    const resolvedRefreshToken =
      params.refreshToken ??
      this.authCookiesService.getRefreshTokenFromCookieHeader(params.cookieHeader);

    if (!resolvedRefreshToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    const refreshTokenPayload =
      this.authTokensService.verifyRefreshToken(resolvedRefreshToken);
    const persistedSession = await this.authSessionsService.validateRefreshSession({
      sessionId: refreshTokenPayload.sessionId,
      profileId: refreshTokenPayload.profileId,
      userId: refreshTokenPayload.userId,
      refreshToken: resolvedRefreshToken,
    });

    if (!persistedSession) {
      throw new UnauthorizedException('Unauthorized');
    }

    const profile = await this.getProfileSnapshot(refreshTokenPayload.profileId);

    if (!profile || profile.userId !== refreshTokenPayload.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const issuedSession = this.authTokensService.issueSessionTokens({
      profileId: profile.id,
      userId: profile.userId,
      sessionId: refreshTokenPayload.sessionId,
    });

    await this.authSessionsService.rotateSession({
      sessionId: refreshTokenPayload.sessionId,
      refreshToken: issuedSession.refreshToken,
      refreshTokenExpiresAt: issuedSession.refreshTokenExpiresAt,
      userAgent: params.userAgent,
      ipAddress: this.normalizeIpAddress(params.ipAddress),
    });

    return {
      session: this.createSessionSnapshot(
        profile,
        'access-token',
        refreshTokenPayload.sessionId,
      ),
      issuedSession,
      cookieTransport: this.authCookiesService.getCookieTransportSnapshot(),
    };
  }

  async logoutSession(authContext: ApiAuthContext | undefined) {
    if (!authContext?.isAuthenticated || !authContext.sessionId) {
      return;
    }

    await this.authSessionsService.revokeSession(authContext.sessionId);
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

    const resolvedProfile = await this.authIdentitiesService.resolveClerkIdentity({
      userId: resolvedUserId,
      identity: params.identity,
    });

    return this.createSessionSnapshot(
      resolvedProfile,
      'user-header',
      params.sessionId,
    );
  }

  async registerPasswordIdentity(
    payload: ApiAuthPasswordRegistrationPayload,
    metadata: AuthClientMetadata = {},
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const profile = await this.authIdentitiesService.registerPasswordIdentity(
      payload,
    );

    return this.issueOwnedSession(profile, metadata);
  }

  async loginWithPassword(
    payload: ApiAuthPasswordLoginPayload,
    metadata: AuthClientMetadata = {},
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const profile = await this.authIdentitiesService.authenticatePasswordIdentity(
      payload,
    );

    return this.issueOwnedSession(profile, metadata);
  }

  private async resolveAccessTokenContext(accessToken: string): Promise<ApiAuthContext> {
    const tokenPayload = this.authTokensService.verifyAccessToken(accessToken);
    const persistedSession = await this.authSessionsService.validateSession({
      sessionId: tokenPayload.sessionId,
      profileId: tokenPayload.profileId,
      userId: tokenPayload.userId,
    });

    if (!persistedSession) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.authSessionsService.touchSession(tokenPayload.sessionId);

    return {
      isAuthenticated: true,
      strategy: 'access-token',
      profileId: tokenPayload.profileId,
      sessionId: tokenPayload.sessionId,
      userId: tokenPayload.userId,
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
    sessionId?: string | null,
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

  private normalizeIpAddress(ipAddress: string | undefined) {
    if (!ipAddress) {
      return undefined;
    }

    const [firstIpAddress] = ipAddress.split(',');
    const resolvedIpAddress = firstIpAddress?.trim();

    return resolvedIpAddress && resolvedIpAddress.length > 0
      ? resolvedIpAddress
      : undefined;
  }

  private async issueOwnedSession(
    profile: {
      id: string;
      userId: string;
      name: string;
      email: string;
      imageUrl: string;
      createdAt: Date;
      updatedAt: Date;
    },
    metadata: AuthClientMetadata,
  ): Promise<ApiAuthSessionExchangeSnapshot> {
    const issuedSession = this.authTokensService.issueSessionTokens({
      profileId: profile.id,
      userId: profile.userId,
    });

    await this.authSessionsService.createSession({
      sessionId: issuedSession.sessionId,
      profileId: profile.id,
      userId: profile.userId,
      refreshToken: issuedSession.refreshToken,
      refreshTokenExpiresAt: issuedSession.refreshTokenExpiresAt,
      userAgent: metadata.userAgent,
      ipAddress: this.normalizeIpAddress(metadata.ipAddress),
    });

    return {
      session: this.createSessionSnapshot(
        profile,
        'access-token',
        issuedSession.sessionId,
      ),
      issuedSession,
      cookieTransport: this.authCookiesService.getCookieTransportSnapshot(),
    };
  }
}
