import { createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';

type LocalTurnCredentialStatus = 'disabled' | 'ready';

export type LocalTurnCredentialResponse = {
  status: LocalTurnCredentialStatus;
  enabled: boolean;
  urls: string[];
  ttlSeconds: number;
  expiresAt?: string;
  expiresAtUnixSeconds?: number;
  username?: string;
  credential?: string;
  reason?: string;
};

const DEFAULT_LOCAL_TURN_TTL_SECONDS = 600;
const MIN_LOCAL_TURN_TTL_SECONDS = 60;
const MAX_LOCAL_TURN_TTL_SECONDS = 3600;

@Injectable()
export class TurnCredentialService {
  issueLocalCredentials(profileId: string | undefined): LocalTurnCredentialResponse {
    const urls = this.getLocalTurnUrls();
    const ttlSeconds = this.getLocalTurnTtlSeconds();

    if (process.env.NODE_ENV === 'production') {
      return this.createDisabledResponse(urls, ttlSeconds, 'Local TURN credentials are disabled in production runtime');
    }

    if (!profileId) {
      return this.createDisabledResponse(urls, ttlSeconds, 'Authenticated profile is required');
    }

    const secret = process.env.LOCAL_TURN_STATIC_AUTH_SECRET?.trim();

    if (!secret) {
      return this.createDisabledResponse(urls, ttlSeconds, 'LOCAL_TURN_STATIC_AUTH_SECRET is not configured');
    }

    if (urls.length === 0) {
      return this.createDisabledResponse(urls, ttlSeconds, 'LOCAL_TURN_URLS has no valid turn: or turns: URLs');
    }

    const expiresAtUnixSeconds = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiresAtUnixSeconds}:${profileId}`;
    const credential = createHmac('sha1', secret).update(username).digest('base64');

    return {
      status: 'ready',
      enabled: true,
      urls,
      username,
      credential,
      ttlSeconds,
      expiresAt: new Date(expiresAtUnixSeconds * 1000).toISOString(),
      expiresAtUnixSeconds,
    };
  }

  private createDisabledResponse(
    urls: string[],
    ttlSeconds: number,
    reason: string,
  ): LocalTurnCredentialResponse {
    return {
      status: 'disabled',
      enabled: false,
      urls,
      ttlSeconds,
      reason,
    };
  }

  private getLocalTurnUrls() {
    const value = process.env.LOCAL_TURN_URLS;

    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('turn:') || url.startsWith('turns:'));
  }

  private getLocalTurnTtlSeconds() {
    const rawTtlSeconds = Number(process.env.LOCAL_TURN_TTL_SECONDS);

    if (!Number.isFinite(rawTtlSeconds)) {
      return DEFAULT_LOCAL_TURN_TTL_SECONDS;
    }

    return Math.min(
      Math.max(Math.trunc(rawTtlSeconds), MIN_LOCAL_TURN_TTL_SECONDS),
      MAX_LOCAL_TURN_TTL_SECONDS,
    );
  }
}
