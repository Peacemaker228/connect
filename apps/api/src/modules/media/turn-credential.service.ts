import { createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { MediaRuntimeConfigService } from './media-runtime-config.service';

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

@Injectable()
export class TurnCredentialService {
  constructor(private readonly mediaRuntimeConfigService: MediaRuntimeConfigService) {}

  issueLocalCredentials(profileId: string | undefined): LocalTurnCredentialResponse {
    const config = this.mediaRuntimeConfigService.getTurnCredentialConfig();
    const { urls, ttlSeconds } = config;

    if (process.env.NODE_ENV === 'production') {
      return this.createDisabledResponse(urls, ttlSeconds, 'Local TURN credentials are disabled in production runtime');
    }

    if (!profileId) {
      return this.createDisabledResponse(urls, ttlSeconds, 'Authenticated profile is required');
    }

    const secret = config.staticAuthSecret;

    if (!secret) {
      return this.createDisabledResponse(urls, ttlSeconds, 'TURN static auth secret is not configured');
    }

    if (urls.length === 0) {
      return this.createDisabledResponse(urls, ttlSeconds, 'TURN URLs have no valid turn: or turns: entries');
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
}
