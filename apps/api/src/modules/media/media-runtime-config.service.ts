import { Injectable } from '@nestjs/common';
import type { types as mediasoupTypes } from 'mediasoup';

const DEFAULT_TURN_TTL_SECONDS = 600;
const MIN_TURN_TTL_SECONDS = 60;
const MAX_TURN_TTL_SECONDS = 3600;
const DEFAULT_SFU_LISTEN_IP = '127.0.0.1';
const STAGING_SFU_ENABLE_ENV = 'MEDIA_ENABLE_STAGING_SFU';

type EnvReadResult = {
  value?: string;
  source: string;
};

export type MediaRuntimePortRangeSnapshot = {
  status: 'unset' | 'ready' | 'invalid';
  source: string;
  min?: number;
  max?: number;
  reason?: string;
};

export type MediaRuntimeConfigSnapshot = {
  turn: {
    urlsConfigured: boolean;
    urlCount: number;
    urlsSource: string;
    staticAuthSecretConfigured: boolean;
    staticAuthSecretSource: string;
    ttlSeconds: number;
    ttlSource: string;
    relayPortRange: MediaRuntimePortRangeSnapshot;
  };
  sfu: {
    listenIp: string;
    listenIpSource: string;
    announcedAddressConfigured: boolean;
    announcedAddressSource: string;
    rtcPortRange: MediaRuntimePortRangeSnapshot;
    stagingSfuEnabled: boolean;
    stagingSfuGateSource: string;
  };
};

export type MediaRuntimeTurnCredentialConfig = {
  urls: string[];
  urlsSource: string;
  staticAuthSecret?: string;
  staticAuthSecretSource: string;
  ttlSeconds: number;
  ttlSource: string;
};

export type MediaRuntimeMediasoupListenInfoResult = {
  enabled: boolean;
  listenInfos: mediasoupTypes.TransportListenInfo[];
  reason?: string;
};

@Injectable()
export class MediaRuntimeConfigService {
  isLocalMediaPrototypeEnabled() {
    return process.env.NODE_ENV !== 'production' || this.isStagingSfuEnabled();
  }

  isStagingSfuEnabled() {
    return this.readBooleanEnv(STAGING_SFU_ENABLE_ENV);
  }

  getTurnCredentialConfig(): MediaRuntimeTurnCredentialConfig {
    const urls = this.readPreferredEnv('MEDIA_TURN_URLS', 'LOCAL_TURN_URLS');
    const staticAuthSecret = this.readPreferredEnv(
      'MEDIA_TURN_STATIC_AUTH_SECRET',
      'LOCAL_TURN_STATIC_AUTH_SECRET',
    );
    const ttl = this.readClampedIntegerEnv(
      'MEDIA_TURN_TTL_SECONDS',
      'LOCAL_TURN_TTL_SECONDS',
      DEFAULT_TURN_TTL_SECONDS,
      MIN_TURN_TTL_SECONDS,
      MAX_TURN_TTL_SECONDS,
    );

    return {
      urls: this.parseTurnUrls(urls.value),
      urlsSource: urls.source,
      staticAuthSecret: staticAuthSecret.value,
      staticAuthSecretSource: staticAuthSecret.source,
      ttlSeconds: ttl.value,
      ttlSource: ttl.source,
    };
  }

  getMediasoupListenInfos(): MediaRuntimeMediasoupListenInfoResult {
    const sfuConfig = this.getSfuConfig();

    if (sfuConfig.rtcPortRange.status === 'invalid') {
      return {
        enabled: false,
        listenInfos: [],
        reason: sfuConfig.rtcPortRange.reason,
      };
    }

    const listenInfoBase: Omit<mediasoupTypes.TransportListenInfo, 'protocol'> = {
      ip: sfuConfig.listenIp,
      announcedAddress: sfuConfig.announcedAddress,
    };

    if (sfuConfig.rtcPortRange.status === 'ready') {
      listenInfoBase.portRange = {
        min: sfuConfig.rtcPortRange.min!,
        max: sfuConfig.rtcPortRange.max!,
      };
    }

    return {
      enabled: true,
      listenInfos: [
        {
          protocol: 'udp',
          ...listenInfoBase,
        },
        {
          protocol: 'tcp',
          ...listenInfoBase,
        },
      ],
    };
  }

  getPublicSnapshot(): MediaRuntimeConfigSnapshot {
    const turnConfig = this.getTurnCredentialConfig();
    const sfuConfig = this.getSfuConfig();

    return {
      turn: {
        urlsConfigured: turnConfig.urls.length > 0,
        urlCount: turnConfig.urls.length,
        urlsSource: turnConfig.urlsSource,
        staticAuthSecretConfigured: Boolean(turnConfig.staticAuthSecret),
        staticAuthSecretSource: turnConfig.staticAuthSecretSource,
        ttlSeconds: turnConfig.ttlSeconds,
        ttlSource: turnConfig.ttlSource,
        relayPortRange: this.readPortRange(
          'MEDIA_TURN_RELAY_MIN_PORT',
          'MEDIA_TURN_RELAY_MAX_PORT',
          'LOCAL_TURN_RELAY_MIN_PORT',
          'LOCAL_TURN_RELAY_MAX_PORT',
        ),
      },
      sfu: {
        listenIp: sfuConfig.listenIp,
        listenIpSource: sfuConfig.listenIpSource,
        announcedAddressConfigured: Boolean(sfuConfig.announcedAddress),
        announcedAddressSource: sfuConfig.announcedAddressSource,
        rtcPortRange: sfuConfig.rtcPortRange,
        stagingSfuEnabled: this.isStagingSfuEnabled(),
        stagingSfuGateSource: STAGING_SFU_ENABLE_ENV,
      },
    };
  }

  private getSfuConfig() {
    const listenIp = this.readPreferredEnv('MEDIA_SFU_LISTEN_IP', 'LOCAL_MEDIASOUP_LISTEN_IP');
    const announcedAddress = this.readPreferredEnv(
      'MEDIA_SFU_ANNOUNCED_ADDRESS',
      'LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS',
    );

    return {
      listenIp: listenIp.value ?? DEFAULT_SFU_LISTEN_IP,
      listenIpSource: listenIp.value ? listenIp.source : 'default',
      announcedAddress: announcedAddress.value,
      announcedAddressSource: announcedAddress.source,
      rtcPortRange: this.readPortRange('MEDIA_SFU_RTC_MIN_PORT', 'MEDIA_SFU_RTC_MAX_PORT'),
    };
  }

  private readPreferredEnv(primaryName: string, fallbackName?: string): EnvReadResult {
    const primaryValue = this.readTrimmedEnv(primaryName);

    if (primaryValue) {
      return {
        value: primaryValue,
        source: primaryName,
      };
    }

    if (!fallbackName) {
      return {
        source: 'unset',
      };
    }

    const fallbackValue = this.readTrimmedEnv(fallbackName);

    if (fallbackValue) {
      return {
        value: fallbackValue,
        source: fallbackName,
      };
    }

    return {
      source: 'unset',
    };
  }

  private readClampedIntegerEnv(
    primaryName: string,
    fallbackName: string,
    fallbackValue: number,
    minimum: number,
    maximum: number,
  ) {
    const envValue = this.readPreferredEnv(primaryName, fallbackName);
    const parsedValue = Number(envValue.value);

    if (!Number.isFinite(parsedValue)) {
      return {
        value: fallbackValue,
        source: envValue.source === 'unset' ? 'default' : `${envValue.source}:invalid-default`,
      };
    }

    return {
      value: Math.min(Math.max(Math.trunc(parsedValue), minimum), maximum),
      source: envValue.source,
    };
  }

  private readPortRange(
    primaryMinName: string,
    primaryMaxName: string,
    fallbackMinName?: string,
    fallbackMaxName?: string,
  ): MediaRuntimePortRangeSnapshot {
    const primaryMin = this.readTrimmedEnv(primaryMinName);
    const primaryMax = this.readTrimmedEnv(primaryMaxName);
    const hasPrimary = Boolean(primaryMin || primaryMax);

    const minName = hasPrimary ? primaryMinName : fallbackMinName;
    const maxName = hasPrimary ? primaryMaxName : fallbackMaxName;

    if (!minName || !maxName) {
      return {
        status: 'unset',
        source: 'unset',
      };
    }

    const minRaw = hasPrimary ? primaryMin : this.readTrimmedEnv(minName);
    const maxRaw = hasPrimary ? primaryMax : this.readTrimmedEnv(maxName);
    const source = hasPrimary ? `${primaryMinName}/${primaryMaxName}` : `${minName}/${maxName}`;

    if (!minRaw && !maxRaw) {
      return {
        status: 'unset',
        source: 'unset',
      };
    }

    if (!minRaw || !maxRaw) {
      return {
        status: 'invalid',
        source,
        reason: `Both ${minName} and ${maxName} must be configured for a media port range`,
      };
    }

    const min = Number(minRaw);
    const max = Number(maxRaw);

    if (!this.isValidPort(min) || !this.isValidPort(max)) {
      return {
        status: 'invalid',
        source,
        reason: `Media port range ${source} must contain integer ports between 1 and 65535`,
      };
    }

    if (min > max) {
      return {
        status: 'invalid',
        source,
        reason: `Media port range ${source} has min greater than max`,
      };
    }

    return {
      status: 'ready',
      source,
      min,
      max,
    };
  }

  private parseTurnUrls(value: string | undefined) {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('turn:') || url.startsWith('turns:'));
  }

  private readTrimmedEnv(name: string) {
    return process.env[name]?.trim() || undefined;
  }

  private readBooleanEnv(name: string) {
    const value = this.readTrimmedEnv(name)?.toLowerCase();

    return value === '1' || value === 'true' || value === 'yes';
  }

  private isValidPort(value: number) {
    return Number.isInteger(value) && value >= 1 && value <= 65535;
  }
}
