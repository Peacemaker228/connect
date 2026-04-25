import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ApiAuthCookieTransportSnapshot,
  ApiAuthIssuedSessionSnapshot,
} from './auth.types';
import type { AuthRequestHeaders } from './auth-request.interface';
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_COOKIE_PATH,
  AUTH_COOKIE_SAME_SITE,
  AUTH_REFRESH_TOKEN_COOKIE,
} from './auth.constants';

export type AuthCookieResponse = {
  getHeader(name: string): number | string | string[] | undefined;
  setHeader(name: string, value: number | string | readonly string[]): void;
};

@Injectable()
export class AuthCookiesService {
  constructor(private readonly configService: ConfigService) {}

  getCookieTransportSnapshot(): ApiAuthCookieTransportSnapshot {
    return {
      accessTokenCookieName: AUTH_ACCESS_TOKEN_COOKIE,
      refreshTokenCookieName: AUTH_REFRESH_TOKEN_COOKIE,
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: AUTH_COOKIE_PATH,
    };
  }

  getAccessTokenFromHeaders(headers: AuthRequestHeaders) {
    return this.getCookieValue(headers.cookie, AUTH_ACCESS_TOKEN_COOKIE);
  }

  getRefreshTokenFromCookieHeader(cookieHeader: string | string[] | undefined) {
    return this.getCookieValue(cookieHeader, AUTH_REFRESH_TOKEN_COOKIE);
  }

  applyIssuedSessionCookies(
    response: AuthCookieResponse,
    issuedSession: ApiAuthIssuedSessionSnapshot,
  ) {
    this.appendSetCookieHeader(
      response,
      this.createCookie({
        name: AUTH_ACCESS_TOKEN_COOKIE,
        value: issuedSession.accessToken,
        expiresAt: issuedSession.accessTokenExpiresAt,
      }),
    );
    this.appendSetCookieHeader(
      response,
      this.createCookie({
        name: AUTH_REFRESH_TOKEN_COOKIE,
        value: issuedSession.refreshToken,
        expiresAt: issuedSession.refreshTokenExpiresAt,
      }),
    );
  }

  clearSessionCookies(response: AuthCookieResponse) {
    this.appendSetCookieHeader(
      response,
      this.createCookie({
        name: AUTH_ACCESS_TOKEN_COOKIE,
        value: '',
        expiresAt: new Date(0),
        maxAge: 0,
      }),
    );
    this.appendSetCookieHeader(
      response,
      this.createCookie({
        name: AUTH_REFRESH_TOKEN_COOKIE,
        value: '',
        expiresAt: new Date(0),
        maxAge: 0,
      }),
    );
  }

  private getCookieValue(
    cookieHeader: AuthRequestHeaders['cookie'],
    cookieName: string,
  ) {
    const rawCookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

    if (!rawCookieValue) {
      return undefined;
    }

    const cookies = rawCookieValue.split(';');

    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');

      if (name === cookieName) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return undefined;
  }

  private createCookie(params: {
    name: string;
    value: string;
    expiresAt: Date;
    maxAge?: number;
  }) {
    const cookieParts = [
      `${params.name}=${encodeURIComponent(params.value)}`,
      `Path=${AUTH_COOKIE_PATH}`,
      'HttpOnly',
      `SameSite=${AUTH_COOKIE_SAME_SITE}`,
      `Expires=${params.expiresAt.toUTCString()}`,
    ];

    if (typeof params.maxAge === 'number') {
      cookieParts.push(`Max-Age=${params.maxAge}`);
    }

    if (this.isSecureCookie()) {
      cookieParts.push('Secure');
    }

    return cookieParts.join('; ');
  }

  private appendSetCookieHeader(
    response: AuthCookieResponse,
    cookieValue: string,
  ) {
    const existingHeader = response.getHeader('Set-Cookie');

    if (!existingHeader) {
      response.setHeader('Set-Cookie', [cookieValue]);
      return;
    }

    if (Array.isArray(existingHeader)) {
      response.setHeader('Set-Cookie', [...existingHeader, cookieValue]);
      return;
    }

    response.setHeader('Set-Cookie', [String(existingHeader), cookieValue]);
  }

  private isSecureCookie() {
    return (this.configService.get<string>('NODE_ENV') ?? 'development') === 'production';
  }
}
