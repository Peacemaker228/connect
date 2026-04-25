import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import type { ApiAuthIssuedSessionSnapshot } from './auth.types';

type AuthTokenKind = 'access' | 'refresh';

type AuthTokenPayload = {
  v: 1;
  typ: AuthTokenKind;
  sid: string;
  pid: string;
  uid: string;
  iat: number;
  exp: number;
};

type IssuedToken = {
  token: string;
  expiresAt: Date;
};

type VerifiedAuthTokenPayload = {
  sessionId: string;
  profileId: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
};

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_AUTH_TOKEN_SECRET = 'dev-auth-token-secret-change-me';

@Injectable()
export class AuthTokensService {
  constructor(private readonly configService: ConfigService) {}

  issueSessionTokens(params: {
    profileId: string;
    userId: string;
    sessionId?: string | null;
  }): ApiAuthIssuedSessionSnapshot {
    const sessionId = params.sessionId ?? randomUUID();
    const issuedAt = new Date();
    const accessToken = this.issueToken(
      'access',
      params.profileId,
      params.userId,
      sessionId,
      issuedAt,
      this.getAccessTokenTtlSeconds(),
    );
    const refreshToken = this.issueToken(
      'refresh',
      params.profileId,
      params.userId,
      sessionId,
      issuedAt,
      this.getRefreshTokenTtlSeconds(),
    );

    return {
      sessionId,
      tokenType: 'Bearer',
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      issuedAt,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }

  verifyAccessToken(token: string | undefined): VerifiedAuthTokenPayload {
    return this.verifyToken(token, 'access');
  }

  verifyRefreshToken(token: string | undefined): VerifiedAuthTokenPayload {
    return this.verifyToken(token, 'refresh');
  }

  private issueToken(
    type: AuthTokenKind,
    profileId: string,
    userId: string,
    sessionId: string,
    issuedAt: Date,
    ttlSeconds: number,
  ): IssuedToken {
    const issuedAtSeconds = Math.floor(issuedAt.getTime() / 1000);
    const expiresAt = new Date((issuedAtSeconds + ttlSeconds) * 1000);
    const payload: AuthTokenPayload = {
      v: 1,
      typ: type,
      sid: sessionId,
      pid: profileId,
      uid: userId,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + ttlSeconds,
    };
    const encodedPayload = this.encodeSegment(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);

    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt,
    };
  }

  private verifyToken(
    token: string | undefined,
    expectedType: AuthTokenKind,
  ): VerifiedAuthTokenPayload {
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    const [encodedPayload, providedSignature] = token.split('.');

    if (!encodedPayload || !providedSignature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.sign(encodedPayload);

    if (
      providedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const parsedPayload = this.parsePayload(encodedPayload);

    if (parsedPayload.typ !== expectedType || parsedPayload.v !== 1) {
      throw new UnauthorizedException('Invalid token');
    }

    if (parsedPayload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return {
      sessionId: parsedPayload.sid,
      profileId: parsedPayload.pid,
      userId: parsedPayload.uid,
      issuedAt: new Date(parsedPayload.iat * 1000),
      expiresAt: new Date(parsedPayload.exp * 1000),
    };
  }

  private parsePayload(encodedPayload: string): AuthTokenPayload {
    try {
      return JSON.parse(this.decodeSegment(encodedPayload)) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private sign(value: string) {
    return this.encodeBuffer(
      createHmac('sha256', this.getTokenSecret()).update(value).digest(),
    );
  }

  private getTokenSecret() {
    return (
      this.configService.get<string>('AUTH_TOKEN_SECRET') ?? DEFAULT_AUTH_TOKEN_SECRET
    );
  }

  private getAccessTokenTtlSeconds() {
    return this.parseTtl(
      this.configService.get<string>('AUTH_ACCESS_TOKEN_TTL_SECONDS'),
      DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  private getRefreshTokenTtlSeconds() {
    return this.parseTtl(
      this.configService.get<string>('AUTH_REFRESH_TOKEN_TTL_SECONDS'),
      DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    );
  }

  private parseTtl(value: string | undefined, fallback: number) {
    if (!value) {
      return fallback;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0
      ? parsedValue
      : fallback;
  }

  private encodeSegment(value: string) {
    return this.encodeBuffer(Buffer.from(value));
  }

  private encodeBuffer(value: Buffer) {
    return value
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private decodeSegment(value: string) {
    const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalizedValue.length % 4;
    const paddedValue =
      padding === 0 ? normalizedValue : `${normalizedValue}${'='.repeat(4 - padding)}`;

    return Buffer.from(paddedValue, 'base64').toString('utf8');
  }
}
