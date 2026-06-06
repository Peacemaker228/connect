import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker, version as mediasoupVersion, workerBin } from 'mediasoup';
import type { types as mediasoupTypes } from 'mediasoup';

import { MediaSignalingService } from './media-signaling.service';
import { MediaParticipantSessionService } from './media-participant-session.service';
import {
  MediaRuntimeConfigService,
  type MediaRuntimeConfigSnapshot,
} from './media-runtime-config.service';

type LocalMediasoupPrototypeStatus = 'disabled' | 'ready' | 'failed';
type LocalMediasoupTransportDirection = 'send' | 'recv';
type LocalMediasoupTransportMode = 'direct' | 'turn' | 'unknown';
type LocalMediasoupTrackSource = 'microphone' | 'camera' | 'screen';

type LocalMediasoupTrackSourceCounts = Record<LocalMediasoupTrackSource, number>;
type LocalMediasoupTransportModeCounts = Record<LocalMediasoupTransportMode, number>;

type LocalMediasoupRoomBreakdown = {
  roomId: string;
  participantSessionCount: number;
  transportCount: number;
  producerCount: number;
  consumerCount: number;
  producerCountsBySource: LocalMediasoupTrackSourceCounts;
  consumerCountsBySource: LocalMediasoupTrackSourceCounts;
  transportModeCounts: LocalMediasoupTransportModeCounts;
};

type MutableLocalMediasoupRoomBreakdown = LocalMediasoupRoomBreakdown & {
  participantSessionIds: Set<string>;
};

export type LocalMediasoupObservabilityCounters = {
  failedTransportCreateCount: number;
  failedTransportConnectCount: number;
  failedProduceCount: number;
  failedConsumeCount: number;
  failedConsumerResumeCount: number;
  screenShareStartCount: number;
  screenShareStopCount: number;
  screenShareTakeoverCount: number;
  olderScreenProducerClosedDueToTakeoverCount: number;
  sessionCloseCount: number;
  staleSweepCount: number;
  staleSessionsClosedCount: number;
  failedStateRejoinRecoveryCount: number;
};

export type LocalMediasoupSessionScope = {
  roomId: string;
  participantSessionId: string;
};

export type LocalMediasoupPrototypeHealth = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  version: string;
  workerBin: string;
  workerPid?: number;
  workerClosed?: boolean;
  routerId?: string;
  routerClosed?: boolean;
  routerCodecCount?: number;
  routerRtpCapabilities?: mediasoupTypes.RtpCapabilities;
  activeTransportCount?: number;
  activeProducerCount?: number;
  activeConsumerCount?: number;
  activeRoomCount?: number;
  trackedSessionCount?: number;
  producerCountsBySource?: LocalMediasoupTrackSourceCounts;
  consumerCountsBySource?: LocalMediasoupTrackSourceCounts;
  transportModeCounts?: LocalMediasoupTransportModeCounts;
  rooms?: LocalMediasoupRoomBreakdown[];
  counters?: LocalMediasoupObservabilityCounters;
  staleSessionTtlMs?: number;
  staleSessionSweepIntervalMs?: number;
  lastCleanup?: LocalMediasoupCleanupResult;
  runtimeConfig?: MediaRuntimeConfigSnapshot;
  reason?: string;
};

export type LocalMediasoupHeartbeatResult = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  roomId?: string;
  participantSessionId?: string;
  lastSeenAt?: string;
  staleSessionTtlMs?: number;
  staleSessionSweepIntervalMs?: number;
  reason?: string;
};

export type LocalMediasoupCleanupResult = {
  cleanedAt: string;
  reason: 'session-close' | 'stale-sweep';
  staleSessionCount: number;
  closedTransportCount: number;
  closedProducerCount: number;
  closedConsumerCount: number;
  activeTransportCount: number;
  activeProducerCount: number;
  activeConsumerCount: number;
  activeRoomCount: number;
  trackedSessionCount: number;
};

export type LocalMediasoupTransportMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  direction?: LocalMediasoupTransportDirection;
  requestedTransportMode?: LocalMediasoupTransportMode;
  transportId?: string;
  iceParameters?: mediasoupTypes.IceParameters;
  iceCandidates?: mediasoupTypes.IceCandidate[];
  dtlsParameters?: mediasoupTypes.DtlsParameters;
  sctpParameters?: mediasoupTypes.SctpParameters;
  reason?: string;
};

export type LocalMediasoupTransportConnectResult = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  dtlsState?: mediasoupTypes.DtlsState;
  reason?: string;
};

export type LocalMediasoupTransportCloseResult = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  roomId?: string;
  participantSessionId?: string;
  closedTransportCount?: number;
  closedProducerCount?: number;
  closedConsumerCount?: number;
  activeTransportCount?: number;
  activeProducerCount?: number;
  activeConsumerCount?: number;
  activeRoomCount?: number;
  reason?: string;
};

export type LocalMediasoupProducerMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  roomId?: string;
  participantSessionId?: string;
  producerId?: string;
  kind?: mediasoupTypes.MediaKind;
  source?: LocalMediasoupTrackSource;
  paused?: boolean;
  reason?: string;
};

export type LocalMediasoupConsumerMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  roomId?: string;
  participantSessionId?: string;
  consumerId?: string;
  producerId?: string;
  kind?: mediasoupTypes.MediaKind;
  rtpParameters?: mediasoupTypes.RtpParameters;
  type?: mediasoupTypes.ConsumerType;
  paused?: boolean;
  producerPaused?: boolean;
  reason?: string;
};

export type LocalMediasoupProducerDiscoveryMetadata = {
  producerId: string;
  roomId: string;
  participantSessionId: string;
  kind: mediasoupTypes.MediaKind;
  source: LocalMediasoupTrackSource;
  paused: boolean;
  createdAt?: string;
};

export type LocalMediasoupProducerDiscoveryResult = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  roomId?: string;
  participantSessionId?: string;
  producers: LocalMediasoupProducerDiscoveryMetadata[];
  reason?: string;
};

const LOCAL_PROTOTYPE_MEDIA_CODECS: mediasoupTypes.RouterRtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

@Injectable()
export class MediasoupPrototypeService implements OnModuleDestroy {
  private readonly logger = new Logger(MediasoupPrototypeService.name);

  constructor(
    private readonly mediaSignalingService: MediaSignalingService,
    private readonly mediaParticipantSessionService: MediaParticipantSessionService,
    private readonly mediaRuntimeConfigService: MediaRuntimeConfigService,
  ) {}

  private worker: mediasoupTypes.Worker | null = null;
  private router: mediasoupTypes.Router | null = null;
  private readonly transports = new Map<string, mediasoupTypes.WebRtcTransport>();
  private readonly transportDirections = new Map<string, LocalMediasoupTransportDirection>();
  private readonly transportModes = new Map<string, LocalMediasoupTransportMode>();
  private readonly transportScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly producers = new Map<string, mediasoupTypes.Producer>();
  private readonly producerScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly producerCreatedAt = new Map<string, string>();
  private readonly producerSources = new Map<string, LocalMediasoupTrackSource>();
  private readonly producerTransportIds = new Map<string, string>();
  private readonly consumers = new Map<string, mediasoupTypes.Consumer>();
  private readonly consumerScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly consumerProducerIds = new Map<string, string>();
  private readonly consumerTransportIds = new Map<string, string>();
  private readonly sessionLastSeenAt = new Map<string, number>();
  private staleSessionSweepTimer: ReturnType<typeof setInterval> | null = null;
  private lastCleanup: LocalMediasoupCleanupResult | undefined;
  private lastFailure: string | null = null;
  private readonly observabilityCounters: LocalMediasoupObservabilityCounters = {
    failedTransportCreateCount: 0,
    failedTransportConnectCount: 0,
    failedProduceCount: 0,
    failedConsumeCount: 0,
    failedConsumerResumeCount: 0,
    screenShareStartCount: 0,
    screenShareStopCount: 0,
    screenShareTakeoverCount: 0,
    olderScreenProducerClosedDueToTakeoverCount: 0,
    sessionCloseCount: 0,
    staleSweepCount: 0,
    staleSessionsClosedCount: 0,
    failedStateRejoinRecoveryCount: 0,
  };

  private isPrototypeRuntimeEnabled() {
    return this.mediaRuntimeConfigService.isLocalMediaPrototypeEnabled();
  }

  async getHealth(): Promise<LocalMediasoupPrototypeHealth> {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        version: mediasoupVersion,
        workerBin,
        runtimeConfig: this.mediaRuntimeConfigService.getPublicSnapshot(),
        reason: 'Local mediasoup prototype is disabled in production runtime',
      };
    }

    try {
      await this.ensurePrototypeRouter();
      this.ensureStaleSessionSweeper();
      this.sweepStaleSessions('stale-sweep');
      this.lastFailure = null;

      return this.createHealthSnapshot('ready');
    } catch (error) {
      this.lastFailure = error instanceof Error ? error.message : 'Unknown mediasoup prototype failure';

      return this.createHealthSnapshot('failed');
    }
  }

  onModuleDestroy() {
    if (this.staleSessionSweepTimer) {
      clearInterval(this.staleSessionSweepTimer);
      this.staleSessionSweepTimer = null;
    }

    this.router?.close();
    this.worker?.close();
    this.clearPrototypeState();
    this.router = null;
    this.worker = null;
  }

  async createWebRtcTransport({
    direction,
    requestedTransportMode = 'unknown',
    scope,
  }: {
    direction: LocalMediasoupTransportDirection;
    requestedTransportMode?: LocalMediasoupTransportMode;
    scope?: LocalMediasoupSessionScope;
  }): Promise<LocalMediasoupTransportMetadata> {
    this.markSessionActive(scope);

    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        direction,
        requestedTransportMode,
        reason: 'Local mediasoup transport prototype is disabled in production runtime',
      };
    }

    try {
      await this.ensurePrototypeRouter();

      if (!this.router || this.router.closed) {
        this.incrementObservabilityCounter('failedTransportCreateCount');

        return {
          status: 'failed',
          enabled: false,
          direction,
          requestedTransportMode,
          reason: 'Local mediasoup router is not available',
        };
      }

      const listenInfoResult = this.mediaRuntimeConfigService.getMediasoupListenInfos();

      if (!listenInfoResult.enabled) {
        this.incrementObservabilityCounter('failedTransportCreateCount');

        return {
          status: 'failed',
          enabled: false,
          direction,
          requestedTransportMode,
          reason: listenInfoResult.reason ?? 'Mediasoup listen configuration is invalid',
        };
      }

      const transport = await this.router.createWebRtcTransport({
        listenInfos: listenInfoResult.listenInfos,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 600000,
        appData: {
          prototype: 'local-mediasoup',
          direction,
          requestedTransportMode,
          roomId: scope?.roomId,
          participantSessionId: scope?.participantSessionId,
        },
      });

      this.transports.set(transport.id, transport);
      this.transportDirections.set(transport.id, direction);
      this.transportModes.set(transport.id, requestedTransportMode);

      if (scope) {
        this.transportScopes.set(transport.id, scope);
      }

      transport.observer.on('close', () => {
        this.removeTransportState(transport.id);
      });

      this.logLifecycle('transport.created', {
        direction,
        requestedTransportMode,
        transportId: transport.id,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
      });

      return {
        status: 'ready',
        enabled: true,
        direction,
        requestedTransportMode,
        transportId: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
      };
    } catch (error) {
      this.incrementObservabilityCounter('failedTransportCreateCount');
      this.logLifecycle('transport.failed', {
        direction,
        requestedTransportMode,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup transport failure',
      });

      return {
        status: 'failed',
        enabled: false,
        direction,
        requestedTransportMode,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup transport failure',
      };
    }
  }

  async connectWebRtcTransport({
    transportId,
    scope,
    dtlsParameters,
  }: {
    transportId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    dtlsParameters: mediasoupTypes.DtlsParameters | undefined;
  }): Promise<LocalMediasoupTransportConnectResult> {
    this.markSessionActive(scope);

    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        reason: 'Local mediasoup transport prototype is disabled in production runtime',
      };
    }

    if (!transportId) {
      this.incrementObservabilityCounter('failedTransportConnectCount');

      return {
        status: 'failed',
        enabled: false,
        reason: 'transportId is required',
      };
    }

    if (!dtlsParameters) {
      this.incrementObservabilityCounter('failedTransportConnectCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: 'dtlsParameters are required',
      };
    }

    const scopeCheck = this.validateTransportScope(transportId, scope);

    if (!scopeCheck.enabled) {
      this.incrementObservabilityCounter('failedTransportConnectCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: scopeCheck.reason,
      };
    }

    const transport = this.transports.get(transportId);

    if (!transport || transport.closed) {
      this.incrementObservabilityCounter('failedTransportConnectCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: 'Local mediasoup transport was not found',
      };
    }

    try {
      await transport.connect({ dtlsParameters });

      this.logLifecycle('transport.connected', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        dtlsState: transport.dtlsState,
      });

      return {
        status: 'ready',
        enabled: true,
        transportId,
        dtlsState: transport.dtlsState,
      };
    } catch (error) {
      this.incrementObservabilityCounter('failedTransportConnectCount');
      this.logLifecycle('transport.connect.failed', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        dtlsState: transport.dtlsState,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup transport connect failure',
      });

      return {
        status: 'failed',
        enabled: false,
        transportId,
        dtlsState: transport.dtlsState,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup transport connect failure',
      };
    }
  }

  closeWebRtcTransport({
    transportId,
    scope,
  }: {
    transportId: string | undefined;
    scope?: LocalMediasoupSessionScope;
  }): LocalMediasoupTransportCloseResult {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup transport close prototype is disabled in production runtime',
      };
    }

    if (!transportId) {
      return {
        status: 'failed',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'transportId is required',
      };
    }

    const transport = this.transports.get(transportId);

    if (!transport || transport.closed) {
      const counts = this.createLifecycleCounts();

      return {
        status: 'ready',
        enabled: true,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        closedTransportCount: 0,
        closedProducerCount: 0,
        closedConsumerCount: 0,
        activeTransportCount: counts.activeTransportCount,
        activeProducerCount: counts.activeProducerCount,
        activeConsumerCount: counts.activeConsumerCount,
        activeRoomCount: counts.activeRoomCount,
      };
    }

    const scopeCheck = this.validateTransportScope(transportId, scope);

    if (!scopeCheck.enabled) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    const transportScope = this.transportScopes.get(transportId);
    let closedConsumerCount = 0;
    let closedProducerCount = 0;

    for (const [consumerId, consumerTransportId] of [...this.consumerTransportIds.entries()]) {
      if (consumerTransportId !== transportId) {
        continue;
      }

      this.consumers.get(consumerId)?.close();
      this.removeConsumerState(consumerId);
      closedConsumerCount += 1;
    }

    for (const [producerId, producerTransportId] of [...this.producerTransportIds.entries()]) {
      if (producerTransportId !== transportId) {
        continue;
      }

      this.producers.get(producerId)?.close();
      this.removeProducerState(producerId);
      closedProducerCount += 1;
    }

    transport.close();
    this.removeTransportState(transportId);

    this.logLifecycle('transport.closed', {
      transportId,
      roomId: transportScope?.roomId ?? scope?.roomId,
      participantSessionId: transportScope?.participantSessionId ?? scope?.participantSessionId,
      closedProducerCount,
      closedConsumerCount,
    });

    const counts = this.createLifecycleCounts();

    return {
      status: 'ready',
      enabled: true,
      transportId,
      roomId: transportScope?.roomId ?? scope?.roomId,
      participantSessionId: transportScope?.participantSessionId ?? scope?.participantSessionId,
      closedTransportCount: 1,
      closedProducerCount,
      closedConsumerCount,
      activeTransportCount: counts.activeTransportCount,
      activeProducerCount: counts.activeProducerCount,
      activeConsumerCount: counts.activeConsumerCount,
      activeRoomCount: counts.activeRoomCount,
    };
  }

  async produce({
    transportId,
    scope,
    kind,
    source,
    rtpParameters,
    paused,
  }: {
    transportId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    kind: mediasoupTypes.MediaKind | undefined;
    source?: LocalMediasoupTrackSource;
    rtpParameters: mediasoupTypes.RtpParameters | undefined;
    paused?: boolean;
  }): Promise<LocalMediasoupProducerMetadata> {
    this.markSessionActive(scope);

    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup produce prototype is disabled in production runtime',
      };
    }

    const transport = this.getTransportForDirection(transportId, 'send');

    if (!transport.enabled || !transport.transport) {
      this.incrementObservabilityCounter('failedProduceCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: transport.reason,
      };
    }

    const scopeCheck = this.validateTransportScope(transportId, scope);

    if (!scopeCheck.enabled) {
      this.incrementObservabilityCounter('failedProduceCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    if (!kind || (kind !== 'audio' && kind !== 'video')) {
      this.incrementObservabilityCounter('failedProduceCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'kind must be audio or video',
      };
    }

    if (!rtpParameters) {
      this.incrementObservabilityCounter('failedProduceCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        kind,
        reason: 'rtpParameters are required',
      };
    }

    const resolvedSource = this.resolveTrackSource(kind, source);

    if (!resolvedSource) {
      this.incrementObservabilityCounter('failedProduceCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        kind,
        source,
        reason: 'source must be microphone for audio or camera/screen for video',
      };
    }

    try {
      const producer = await transport.transport.produce({
        kind,
        rtpParameters,
        paused,
        appData: {
          prototype: 'local-mediasoup',
          transportId,
          roomId: scope?.roomId,
          participantSessionId: scope?.participantSessionId,
          source: resolvedSource,
        },
      });

      this.producers.set(producer.id, producer);
      const createdAt = new Date().toISOString();

      this.producerCreatedAt.set(producer.id, createdAt);
      this.producerSources.set(producer.id, resolvedSource);
      this.producerTransportIds.set(producer.id, transport.transport.id);

      if (scope) {
        this.producerScopes.set(producer.id, scope);
      }

      if (scope && resolvedSource === 'screen') {
        this.incrementObservabilityCounter('screenShareStartCount');
        const closedScreenProducerCount = this.closeActiveRoomScreenProducers(scope, producer.id);

        if (closedScreenProducerCount > 0) {
          this.incrementObservabilityCounter('screenShareTakeoverCount');
          this.incrementObservabilityCounter(
            'olderScreenProducerClosedDueToTakeoverCount',
            closedScreenProducerCount,
          );
        }
      }

      producer.observer.on('close', () => {
        this.removeProducerState(producer.id);
      });

      if (scope) {
        this.mediaSignalingService.publishProducerPublished({
          producerId: producer.id,
          roomId: scope.roomId,
          participantSessionId: scope.participantSessionId,
          kind: producer.kind,
          source: resolvedSource,
          paused: producer.paused,
          createdAt,
        });
      }

      this.logLifecycle('producer.published', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId: producer.id,
        kind: producer.kind,
        source: resolvedSource,
      });

      return {
        status: 'ready',
        enabled: true,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId: producer.id,
        kind: producer.kind,
        source: resolvedSource,
        paused: producer.paused,
      };
    } catch (error) {
      this.incrementObservabilityCounter('failedProduceCount');
      this.logLifecycle('producer.failed', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        kind,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup produce failure',
      });

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        kind,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup produce failure',
      };
    }
  }

  async consume({
    transportId,
    scope,
    producerId,
    rtpCapabilities,
    paused = false,
  }: {
    transportId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    producerId: string | undefined;
    rtpCapabilities: mediasoupTypes.RtpCapabilities | undefined;
    paused?: boolean;
  }): Promise<LocalMediasoupConsumerMetadata> {
    this.markSessionActive(scope);

    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: 'Local mediasoup consume prototype is disabled in production runtime',
      };
    }

    const transport = this.getTransportForDirection(transportId, 'recv');

    if (!transport.enabled || !transport.transport) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: transport.reason,
      };
    }

    const scopeCheck = this.validateTransportScope(transportId, scope);

    if (!scopeCheck.enabled) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: scopeCheck.reason,
      };
    }

    if (!producerId || !this.producers.has(producerId)) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: 'producerId was not found',
      };
    }

    const producerScopeCheck = this.validateProducerScope(producerId, scope);

    if (!producerScopeCheck.enabled) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: producerScopeCheck.reason,
      };
    }

    if (!rtpCapabilities) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: 'rtpCapabilities are required',
      };
    }

    if (!this.router?.canConsume({ producerId, rtpCapabilities })) {
      this.incrementObservabilityCounter('failedConsumeCount');

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: 'Consumer RTP capabilities are not compatible with producer',
      };
    }

    try {
      const consumer = await transport.transport.consume({
        producerId,
        rtpCapabilities,
        paused,
        appData: {
          prototype: 'local-mediasoup',
          transportId,
          roomId: scope?.roomId,
          participantSessionId: scope?.participantSessionId,
        },
      });

      this.consumers.set(consumer.id, consumer);
      this.consumerProducerIds.set(consumer.id, producerId);
      this.consumerTransportIds.set(consumer.id, transport.transport.id);

      if (scope) {
        this.consumerScopes.set(consumer.id, scope);
      }

      consumer.observer.on('close', () => {
        this.removeConsumerState(consumer.id);
      });

      this.logLifecycle('consumer.created', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        consumerId: consumer.id,
        producerId,
        kind: consumer.kind,
      });

      return {
        status: 'ready',
        enabled: true,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        consumerId: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        paused: consumer.paused,
        producerPaused: consumer.producerPaused,
      };
    } catch (error) {
      this.incrementObservabilityCounter('failedConsumeCount');
      this.logLifecycle('consumer.failed', {
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup consume failure',
      });

      return {
        status: 'failed',
        enabled: false,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup consume failure',
      };
    }
  }

  heartbeatSession(scope: LocalMediasoupSessionScope | undefined): LocalMediasoupHeartbeatResult {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup session heartbeat is disabled in production runtime',
      };
    }

    if (!scope) {
      return {
        status: 'failed',
        enabled: false,
        reason: 'roomId and participantSessionId are required for scoped mediasoup heartbeat',
      };
    }

    const lastSeenAt = this.markSessionActive(scope);

    return {
      status: 'ready',
      enabled: true,
      roomId: scope.roomId,
      participantSessionId: scope.participantSessionId,
      lastSeenAt: new Date(lastSeenAt).toISOString(),
      staleSessionTtlMs: this.getStaleSessionTtlMs(),
      staleSessionSweepIntervalMs: this.getStaleSessionSweepIntervalMs(),
    };
  }

  closeProducer({
    producerId,
    scope,
  }: {
    producerId: string | undefined;
    scope?: LocalMediasoupSessionScope;
  }): LocalMediasoupProducerMetadata {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup producer close prototype is disabled in production runtime',
      };
    }

    if (!producerId) {
      return {
        status: 'failed',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'producerId is required',
      };
    }

    const producer = this.producers.get(producerId);

    if (!producer || producer.closed) {
      return {
        status: 'ready',
        enabled: true,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
      };
    }

    const scopeCheck = this.validateProducerOwnerScope(producerId, scope);

    if (!scopeCheck.enabled) {
      return {
        status: 'failed',
        enabled: false,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    const producerScope = this.producerScopes.get(producerId);
    const source = this.getProducerSource(producerId, producer.kind);

    producer.close();
    this.removeProducerState(producerId);

    return {
      status: 'ready',
      enabled: true,
      producerId,
      roomId: producerScope?.roomId ?? scope?.roomId,
      participantSessionId: producerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: producer.kind,
      source,
      paused: producer.paused,
    };
  }

  async setProducerPaused({
    producerId,
    scope,
    paused,
  }: {
    producerId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    paused: boolean;
  }): Promise<LocalMediasoupProducerMetadata> {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup producer pause/resume prototype is disabled in production runtime',
      };
    }

    if (!producerId) {
      return {
        status: 'failed',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'producerId is required',
      };
    }

    const producer = this.producers.get(producerId);

    if (!producer || producer.closed) {
      return {
        status: 'ready',
        enabled: true,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        paused,
      };
    }

    const scopeCheck = this.validateProducerOwnerScope(producerId, scope);

    if (!scopeCheck.enabled) {
      return {
        status: 'failed',
        enabled: false,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    if (paused) {
      await producer.pause();
    } else {
      await producer.resume();
    }

    const producerScope = this.producerScopes.get(producerId);
    const source = this.getProducerSource(producerId, producer.kind);

    this.logLifecycle(paused ? 'producer.paused' : 'producer.resumed', {
      producerId,
      roomId: producerScope?.roomId ?? scope?.roomId,
      participantSessionId: producerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: producer.kind,
      source,
      paused: producer.paused,
    });

    if (producerScope) {
      this.mediaSignalingService.publishProducerPausedState({
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        producerId,
        paused: producer.paused,
      });
    }

    return {
      status: 'ready',
      enabled: true,
      producerId,
      roomId: producerScope?.roomId ?? scope?.roomId,
      participantSessionId: producerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: producer.kind,
      source,
      paused: producer.paused,
    };
  }

  closeConsumer({
    consumerId,
    scope,
  }: {
    consumerId: string | undefined;
    scope?: LocalMediasoupSessionScope;
  }): LocalMediasoupConsumerMetadata {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        consumerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup consumer close prototype is disabled in production runtime',
      };
    }

    if (!consumerId) {
      return {
        status: 'failed',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'consumerId is required',
      };
    }

    const consumer = this.consumers.get(consumerId);
    const producerId = this.consumerProducerIds.get(consumerId);

    if (!consumer || consumer.closed) {
      return {
        status: 'ready',
        enabled: true,
        consumerId,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
      };
    }

    const scopeCheck = this.validateConsumerOwnerScope(consumerId, scope);

    if (!scopeCheck.enabled) {
      return {
        status: 'failed',
        enabled: false,
        consumerId,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    const consumerScope = this.consumerScopes.get(consumerId);

    consumer.close();
    this.removeConsumerState(consumerId);

    return {
      status: 'ready',
      enabled: true,
      consumerId,
      producerId,
      roomId: consumerScope?.roomId ?? scope?.roomId,
      participantSessionId: consumerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      paused: consumer.paused,
      producerPaused: consumer.producerPaused,
    };
  }

  async setConsumerPaused({
    consumerId,
    scope,
    paused,
  }: {
    consumerId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    paused: boolean;
  }): Promise<LocalMediasoupConsumerMetadata> {
    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        consumerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'Local mediasoup consumer pause/resume prototype is disabled in production runtime',
      };
    }

    if (!consumerId) {
      this.incrementConsumerResumeFailureIfNeeded(paused);

      return {
        status: 'failed',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: 'consumerId is required',
      };
    }

    const consumer = this.consumers.get(consumerId);
    const producerId = this.consumerProducerIds.get(consumerId);

    if (!consumer || consumer.closed) {
      return {
        status: 'ready',
        enabled: true,
        consumerId,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        paused,
      };
    }

    const scopeCheck = this.validateConsumerOwnerScope(consumerId, scope);

    if (!scopeCheck.enabled) {
      this.incrementConsumerResumeFailureIfNeeded(paused);

      return {
        status: 'failed',
        enabled: false,
        consumerId,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: scopeCheck.reason,
      };
    }

    try {
      if (paused) {
        await consumer.pause();
      } else {
        await consumer.resume();
      }
    } catch (error) {
      this.incrementConsumerResumeFailureIfNeeded(paused);

      return {
        status: 'failed',
        enabled: false,
        consumerId,
        producerId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup consumer resume failure',
      };
    }

    const consumerScope = this.consumerScopes.get(consumerId);

    this.logLifecycle(paused ? 'consumer.paused' : 'consumer.resumed', {
      consumerId,
      producerId,
      roomId: consumerScope?.roomId ?? scope?.roomId,
      participantSessionId: consumerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: consumer.kind,
      paused: consumer.paused,
      producerPaused: consumer.producerPaused,
    });

    return {
      status: 'ready',
      enabled: true,
      consumerId,
      producerId,
      roomId: consumerScope?.roomId ?? scope?.roomId,
      participantSessionId: consumerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      paused: consumer.paused,
      producerPaused: consumer.producerPaused,
    };
  }

  listProducers(scope: LocalMediasoupSessionScope | undefined): LocalMediasoupProducerDiscoveryResult {
    this.markSessionActive(scope);

    if (!this.isPrototypeRuntimeEnabled()) {
      return {
        status: 'disabled',
        enabled: false,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producers: [],
        reason: 'Local mediasoup producer discovery prototype is disabled in production runtime',
      };
    }

    if (!scope) {
      return {
        status: 'failed',
        enabled: false,
        producers: [],
        reason: 'roomId and participantSessionId are required for scoped producer discovery',
      };
    }

    const latestProducerByOwnerAndKind = new Map<string, LocalMediasoupProducerDiscoveryMetadata>();

    for (const [producerId, producer] of this.producers.entries()) {
      const producerScope = this.producerScopes.get(producerId);

      if (!producerScope || producer.closed || producerScope.roomId !== scope.roomId) {
        continue;
      }

      if (
        !this.mediaParticipantSessionService.isJoinedSession({
          roomId: producerScope.roomId,
          participantSessionId: producerScope.participantSessionId,
        })
      ) {
        producer.close();
        this.removeProducerState(producerId);
        continue;
      }

      const createdAt = this.producerCreatedAt.get(producerId);
      const source = this.getProducerSource(producerId, producer.kind);
      const discoveryMetadata: LocalMediasoupProducerDiscoveryMetadata = {
        producerId,
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        kind: producer.kind,
        source,
        paused: producer.paused,
        createdAt,
      };
      const ownerAndKindKey = `${producerScope.participantSessionId}:${producer.kind}:${source}`;
      const existing = latestProducerByOwnerAndKind.get(ownerAndKindKey);

      if (!existing || (createdAt ?? '') > (existing.createdAt ?? '')) {
        latestProducerByOwnerAndKind.set(ownerAndKindKey, discoveryMetadata);
      }
    }

    return {
      status: 'ready',
      enabled: true,
      roomId: scope.roomId,
      participantSessionId: scope.participantSessionId,
      producers: [...latestProducerByOwnerAndKind.values()],
    };
  }

  private async ensurePrototypeRouter() {
    if (this.worker && !this.worker.closed && this.router && !this.router.closed) {
      return;
    }

    this.router?.close();
    this.worker?.close();
    this.clearPrototypeState();

    const worker = await createWorker({
      logLevel: 'warn',
      appData: {
        prototype: 'local-mediasoup',
      },
    });

    worker.on('died', (error) => {
      this.lastFailure = error?.message ?? 'mediasoup worker died';
      this.router = null;
      this.worker = null;
    });

    const router = await worker.createRouter({
      mediaCodecs: LOCAL_PROTOTYPE_MEDIA_CODECS,
      appData: {
        prototype: 'local-mediasoup',
      },
    });

    this.worker = worker;
    this.router = router;
  }

  private getTransportForDirection(
    transportId: string | undefined,
    expectedDirection: LocalMediasoupTransportDirection,
  ): {
    enabled: boolean;
    transport?: mediasoupTypes.WebRtcTransport;
    reason?: string;
  } {
    if (!transportId) {
      return {
        enabled: false,
        reason: 'transportId is required',
      };
    }

    const transport = this.transports.get(transportId);

    if (!transport || transport.closed) {
      return {
        enabled: false,
        reason: 'Local mediasoup transport was not found',
      };
    }

    const direction = this.transportDirections.get(transportId);

    if (direction !== expectedDirection) {
      return {
        enabled: false,
        reason: `Transport must be a ${expectedDirection} transport`,
      };
    }

    return {
      enabled: true,
      transport,
    };
  }

  private validateTransportScope(
    transportId: string | undefined,
    scope: LocalMediasoupSessionScope | undefined,
  ): {
    enabled: boolean;
    reason?: string;
  } {
    if (!transportId) {
      return {
        enabled: false,
        reason: 'transportId is required',
      };
    }

    const transportScope = this.transportScopes.get(transportId);

    if (!transportScope && !scope) {
      return {
        enabled: true,
      };
    }

    if (!transportScope || !scope) {
      return {
        enabled: false,
        reason: 'roomId and participantSessionId are required for scoped mediasoup transport access',
      };
    }

    if (
      transportScope.roomId !== scope.roomId ||
      transportScope.participantSessionId !== scope.participantSessionId
    ) {
      return {
        enabled: false,
        reason: 'Scoped mediasoup transport access denied',
      };
    }

    return {
      enabled: true,
    };
  }

  private validateProducerScope(
    producerId: string,
    scope: LocalMediasoupSessionScope | undefined,
  ): {
    enabled: boolean;
    reason?: string;
  } {
    const producerScope = this.producerScopes.get(producerId);

    if (!producerScope && !scope) {
      return {
        enabled: true,
      };
    }

    if (!producerScope || !scope) {
      return {
        enabled: false,
        reason: 'roomId and participantSessionId are required for scoped mediasoup producer access',
      };
    }

    if (producerScope.roomId !== scope.roomId) {
      return {
        enabled: false,
        reason: 'Scoped mediasoup producer access denied',
      };
    }

    return {
      enabled: true,
    };
  }

  private validateProducerOwnerScope(
    producerId: string,
    scope: LocalMediasoupSessionScope | undefined,
  ): {
    enabled: boolean;
    reason?: string;
  } {
    const producerScope = this.producerScopes.get(producerId);

    if (!producerScope && !scope) {
      return {
        enabled: true,
      };
    }

    if (!producerScope || !scope) {
      return {
        enabled: false,
        reason: 'roomId and participantSessionId are required for scoped mediasoup producer close',
      };
    }

    if (
      producerScope.roomId !== scope.roomId ||
      producerScope.participantSessionId !== scope.participantSessionId
    ) {
      return {
        enabled: false,
        reason: 'Scoped mediasoup producer close denied',
      };
    }

    return {
      enabled: true,
    };
  }

  private validateConsumerOwnerScope(
    consumerId: string,
    scope: LocalMediasoupSessionScope | undefined,
  ): {
    enabled: boolean;
    reason?: string;
  } {
    const consumerScope = this.consumerScopes.get(consumerId);

    if (!consumerScope && !scope) {
      return {
        enabled: true,
      };
    }

    if (!consumerScope || !scope) {
      return {
        enabled: false,
        reason: 'roomId and participantSessionId are required for scoped mediasoup consumer close',
      };
    }

    if (
      consumerScope.roomId !== scope.roomId ||
      consumerScope.participantSessionId !== scope.participantSessionId
    ) {
      return {
        enabled: false,
        reason: 'Scoped mediasoup consumer close denied',
      };
    }

    return {
      enabled: true,
    };
  }

  private removeProducerState(producerId: string) {
    const producer = this.producers.get(producerId);
    const producerScope = this.producerScopes.get(producerId);
    const source = producer ? this.getProducerSource(producerId, producer.kind) : undefined;

    this.closeConsumersForProducer(producerId);
    this.producers.delete(producerId);
    this.producerScopes.delete(producerId);
    this.producerCreatedAt.delete(producerId);
    this.producerSources.delete(producerId);
    this.producerTransportIds.delete(producerId);

    if (producerScope && producer) {
      if (source === 'screen') {
        this.incrementObservabilityCounter('screenShareStopCount');
      }

      this.mediaSignalingService.publishProducerClosed({
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        producerId,
      });
      this.logLifecycle('producer.closed', {
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        producerId,
        kind: producer.kind,
        source,
      });
    }
  }

  private removeConsumerState(consumerId: string) {
    const consumerScope = this.consumerScopes.get(consumerId);
    const producerId = this.consumerProducerIds.get(consumerId);

    this.consumers.delete(consumerId);
    this.consumerScopes.delete(consumerId);
    this.consumerProducerIds.delete(consumerId);
    this.consumerTransportIds.delete(consumerId);

    if (consumerScope) {
      this.mediaSignalingService.publishConsumerClosed({
        roomId: consumerScope.roomId,
        participantSessionId: consumerScope.participantSessionId,
        consumerId,
        producerId,
      });
      this.logLifecycle('consumer.closed', {
        roomId: consumerScope.roomId,
        participantSessionId: consumerScope.participantSessionId,
        consumerId,
        producerId,
      });
    }
  }

  private clearPrototypeState() {
    this.consumerProducerIds.clear();
    this.consumerTransportIds.clear();
    this.consumerScopes.clear();
    this.consumers.clear();
    this.producerCreatedAt.clear();
    this.producerTransportIds.clear();
    this.producerScopes.clear();
    this.producerSources.clear();
    this.producers.clear();
    this.transportScopes.clear();
    this.transportDirections.clear();
    this.transportModes.clear();
    this.transports.clear();
    this.sessionLastSeenAt.clear();
  }

  closeSession(scope: LocalMediasoupSessionScope, reason: LocalMediasoupCleanupResult['reason'] = 'session-close') {
    this.incrementObservabilityCounter('sessionCloseCount');

    let closedConsumerCount = 0;
    let closedProducerCount = 0;
    let closedTransportCount = 0;

    for (const [consumerId, consumerScope] of this.consumerScopes.entries()) {
      if (
        consumerScope.roomId === scope.roomId &&
        consumerScope.participantSessionId === scope.participantSessionId
      ) {
        this.consumers.get(consumerId)?.close();
        this.removeConsumerState(consumerId);
        closedConsumerCount += 1;
      }
    }

    for (const [producerId, producerScope] of this.producerScopes.entries()) {
      if (
        producerScope.roomId === scope.roomId &&
        producerScope.participantSessionId === scope.participantSessionId
      ) {
        this.producers.get(producerId)?.close();
        this.removeProducerState(producerId);
        closedProducerCount += 1;
      }
    }

    for (const [transportId, transportScope] of this.transportScopes.entries()) {
      if (
        transportScope.roomId === scope.roomId &&
        transportScope.participantSessionId === scope.participantSessionId
      ) {
        this.transports.get(transportId)?.close();
        this.removeTransportState(transportId);
        closedTransportCount += 1;
      }
    }

    this.sessionLastSeenAt.delete(this.toSessionKey(scope));

    this.logLifecycle('session.closed', {
      roomId: scope.roomId,
      participantSessionId: scope.participantSessionId,
      reason,
      closedTransportCount,
      closedProducerCount,
      closedConsumerCount,
    });

    const counts = this.createLifecycleCounts();
    const cleanup: LocalMediasoupCleanupResult = {
      cleanedAt: new Date().toISOString(),
      reason,
      staleSessionCount: reason === 'stale-sweep' ? 1 : 0,
      closedTransportCount,
      closedProducerCount,
      closedConsumerCount,
      ...counts,
    };

    this.lastCleanup = cleanup;

    return cleanup;
  }

  recordFailedStateRejoinRecovery(scope: LocalMediasoupSessionScope | undefined) {
    if (!this.isPrototypeRuntimeEnabled()) {
      return;
    }

    this.incrementObservabilityCounter('failedStateRejoinRecoveryCount');
    this.logLifecycle('rejoin.failed-state-recovery.requested', {
      roomId: scope?.roomId,
      participantSessionId: scope?.participantSessionId,
    });
  }

  private createHealthSnapshot(status: LocalMediasoupPrototypeStatus): LocalMediasoupPrototypeHealth {
    const counts = this.createLifecycleCounts();

    return {
      status,
      enabled: status !== 'disabled',
      version: mediasoupVersion,
      workerBin,
      workerPid: this.worker?.pid,
      workerClosed: this.worker?.closed,
      routerId: this.router?.id,
      routerClosed: this.router?.closed,
      routerCodecCount: this.router?.rtpCapabilities?.codecs?.length,
      routerRtpCapabilities: this.router?.rtpCapabilities,
      activeTransportCount: counts.activeTransportCount,
      activeProducerCount: counts.activeProducerCount,
      activeConsumerCount: counts.activeConsumerCount,
      activeRoomCount: counts.activeRoomCount,
      trackedSessionCount: counts.trackedSessionCount,
      producerCountsBySource: counts.producerCountsBySource,
      consumerCountsBySource: counts.consumerCountsBySource,
      transportModeCounts: counts.transportModeCounts,
      rooms: counts.rooms,
      counters: { ...this.observabilityCounters },
      staleSessionTtlMs: this.getStaleSessionTtlMs(),
      staleSessionSweepIntervalMs: this.getStaleSessionSweepIntervalMs(),
      lastCleanup: this.lastCleanup,
      runtimeConfig: this.mediaRuntimeConfigService.getPublicSnapshot(),
      reason: status === 'failed' ? this.lastFailure ?? undefined : undefined,
    };
  }

  private closeConsumersForProducer(producerId: string) {
    for (const [consumerId, consumerProducerId] of this.consumerProducerIds.entries()) {
      if (consumerProducerId !== producerId) {
        continue;
      }

      this.consumers.get(consumerId)?.close();
      this.removeConsumerState(consumerId);
    }
  }

  private removeTransportState(transportId: string) {
    this.transports.delete(transportId);
    this.transportDirections.delete(transportId);
    this.transportModes.delete(transportId);
    this.transportScopes.delete(transportId);
  }

  private closeActiveRoomScreenProducers(scope: LocalMediasoupSessionScope, exceptProducerId?: string) {
    let closedProducerCount = 0;

    for (const [producerId, producerScope] of [...this.producerScopes.entries()]) {
      if (
        producerId === exceptProducerId ||
        producerScope.roomId !== scope.roomId ||
        this.producerSources.get(producerId) !== 'screen'
      ) {
        continue;
      }

      this.producers.get(producerId)?.close();
      this.removeProducerState(producerId);
      closedProducerCount += 1;
    }

    return closedProducerCount;
  }

  private createLifecycleCounts() {
    const rooms = new Map<string, MutableLocalMediasoupRoomBreakdown>();
    const producerCountsBySource = this.createTrackSourceCounts();
    const consumerCountsBySource = this.createTrackSourceCounts();
    const transportModeCounts = this.createTransportModeCounts();

    for (const sessionKey of this.sessionLastSeenAt.keys()) {
      const scope = this.fromSessionKey(sessionKey);

      if (!scope) {
        continue;
      }

      this.getRoomBreakdown(rooms, scope.roomId).participantSessionIds.add(scope.participantSessionId);
    }

    for (const [transportId, scope] of this.transportScopes.entries()) {
      const transport = this.transports.get(transportId);

      if (!transport || transport.closed) {
        continue;
      }

      const room = this.getRoomBreakdown(rooms, scope.roomId);
      const mode = this.transportModes.get(transportId) ?? 'unknown';

      room.participantSessionIds.add(scope.participantSessionId);
      room.transportCount += 1;
      room.transportModeCounts[mode] += 1;
      transportModeCounts[mode] += 1;
    }

    for (const [producerId, producer] of this.producers.entries()) {
      const scope = this.producerScopes.get(producerId);

      if (!scope || producer.closed) {
        continue;
      }

      const room = this.getRoomBreakdown(rooms, scope.roomId);
      const source = this.getProducerSource(producerId, producer.kind);

      room.participantSessionIds.add(scope.participantSessionId);
      room.producerCount += 1;
      room.producerCountsBySource[source] += 1;
      producerCountsBySource[source] += 1;
    }

    for (const [consumerId, consumer] of this.consumers.entries()) {
      const scope = this.consumerScopes.get(consumerId);

      if (!scope || consumer.closed) {
        continue;
      }

      const room = this.getRoomBreakdown(rooms, scope.roomId);
      const producerId = this.consumerProducerIds.get(consumerId);
      const producer = producerId ? this.producers.get(producerId) : undefined;

      room.participantSessionIds.add(scope.participantSessionId);
      room.consumerCount += 1;

      if (producerId && producer && !producer.closed) {
        const source = this.getProducerSource(producerId, producer.kind);

        room.consumerCountsBySource[source] += 1;
        consumerCountsBySource[source] += 1;
      }
    }

    const roomBreakdowns = [...rooms.values()]
      .map(({ participantSessionIds, ...room }) => ({
        ...room,
        participantSessionCount: participantSessionIds.size,
      }))
      .sort((left, right) => left.roomId.localeCompare(right.roomId));

    return {
      activeTransportCount: this.transports.size,
      activeProducerCount: this.producers.size,
      activeConsumerCount: this.consumers.size,
      activeRoomCount: roomBreakdowns.length,
      trackedSessionCount: this.sessionLastSeenAt.size,
      producerCountsBySource,
      consumerCountsBySource,
      transportModeCounts,
      rooms: roomBreakdowns,
    };
  }

  private getRoomBreakdown(rooms: Map<string, MutableLocalMediasoupRoomBreakdown>, roomId: string) {
    const existing = rooms.get(roomId);

    if (existing) {
      return existing;
    }

    const room: MutableLocalMediasoupRoomBreakdown = {
      roomId,
      participantSessionCount: 0,
      participantSessionIds: new Set<string>(),
      transportCount: 0,
      producerCount: 0,
      consumerCount: 0,
      producerCountsBySource: this.createTrackSourceCounts(),
      consumerCountsBySource: this.createTrackSourceCounts(),
      transportModeCounts: this.createTransportModeCounts(),
    };

    rooms.set(roomId, room);

    return room;
  }

  private createTrackSourceCounts(): LocalMediasoupTrackSourceCounts {
    return {
      microphone: 0,
      camera: 0,
      screen: 0,
    };
  }

  private createTransportModeCounts(): LocalMediasoupTransportModeCounts {
    return {
      direct: 0,
      turn: 0,
      unknown: 0,
    };
  }

  private incrementObservabilityCounter(
    counter: keyof LocalMediasoupObservabilityCounters,
    increment = 1,
  ) {
    if (!this.isPrototypeRuntimeEnabled()) {
      return;
    }

    this.observabilityCounters[counter] += increment;
  }

  private incrementConsumerResumeFailureIfNeeded(paused: boolean) {
    if (!paused) {
      this.incrementObservabilityCounter('failedConsumerResumeCount');
    }
  }

  private markSessionActive(scope: LocalMediasoupSessionScope | undefined) {
    if (!scope || !this.isPrototypeRuntimeEnabled()) {
      return Date.now();
    }

    this.ensureStaleSessionSweeper();
    const lastSeenAt = Date.now();

    this.sessionLastSeenAt.set(this.toSessionKey(scope), lastSeenAt);

    return lastSeenAt;
  }

  private resolveTrackSource(kind?: mediasoupTypes.MediaKind, source?: LocalMediasoupTrackSource) {
    if (kind === 'audio') {
      return source === undefined || source === 'microphone' ? 'microphone' : undefined;
    }

    if (kind === 'video') {
      if (source === undefined) {
        return 'camera';
      }

      return source === 'camera' || source === 'screen' ? source : undefined;
    }

    return undefined;
  }

  private getProducerSource(producerId: string, kind: mediasoupTypes.MediaKind): LocalMediasoupTrackSource {
    return this.producerSources.get(producerId) ?? (kind === 'audio' ? 'microphone' : 'camera');
  }

  private ensureStaleSessionSweeper() {
    if (!this.isPrototypeRuntimeEnabled() || this.staleSessionSweepTimer) {
      return;
    }

    const intervalMs = this.getStaleSessionSweepIntervalMs();

    this.staleSessionSweepTimer = setInterval(() => {
      this.sweepStaleSessions('stale-sweep');
    }, intervalMs);
    this.staleSessionSweepTimer.unref?.();
  }

  private sweepStaleSessions(reason: LocalMediasoupCleanupResult['reason']) {
    if (!this.isPrototypeRuntimeEnabled()) {
      return;
    }

    this.incrementObservabilityCounter('staleSweepCount');

    const now = Date.now();
    const staleSessionTtlMs = this.getStaleSessionTtlMs();
    let staleSessionCount = 0;
    let closedTransportCount = 0;
    let closedProducerCount = 0;
    let closedConsumerCount = 0;

    for (const [sessionKey, lastSeenAt] of [...this.sessionLastSeenAt.entries()]) {
      if (now - lastSeenAt < staleSessionTtlMs) {
        continue;
      }

      const scope = this.fromSessionKey(sessionKey);

      if (!scope) {
        this.sessionLastSeenAt.delete(sessionKey);
        continue;
      }

      const cleanup = this.closeSession(scope, reason);

      staleSessionCount += 1;
      closedTransportCount += cleanup.closedTransportCount;
      closedProducerCount += cleanup.closedProducerCount;
      closedConsumerCount += cleanup.closedConsumerCount;
    }

    if (staleSessionCount === 0) {
      return;
    }

    this.incrementObservabilityCounter('staleSessionsClosedCount', staleSessionCount);

    const counts = this.createLifecycleCounts();
    const cleanup: LocalMediasoupCleanupResult = {
      cleanedAt: new Date().toISOString(),
      reason,
      staleSessionCount,
      closedTransportCount,
      closedProducerCount,
      closedConsumerCount,
      ...counts,
    };

    this.lastCleanup = cleanup;
    this.logLifecycle('stale-sweep.completed', cleanup);
  }

  private getStaleSessionTtlMs() {
    return this.readPositiveIntegerEnv('LOCAL_MEDIASOUP_STALE_SESSION_TTL_MS', 60_000, 5_000);
  }

  private getStaleSessionSweepIntervalMs() {
    return this.readPositiveIntegerEnv('LOCAL_MEDIASOUP_STALE_SWEEP_INTERVAL_MS', 15_000, 1_000);
  }

  private readPositiveIntegerEnv(name: string, fallback: number, minimum: number) {
    const parsed = Number(process.env[name]);

    return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
  }

  private toSessionKey(scope: LocalMediasoupSessionScope) {
    return `${scope.roomId}\u0000${scope.participantSessionId}`;
  }

  private fromSessionKey(sessionKey: string): LocalMediasoupSessionScope | null {
    const [roomId, participantSessionId] = sessionKey.split('\u0000');

    if (!roomId || !participantSessionId) {
      return null;
    }

    return {
      roomId,
      participantSessionId,
    };
  }

  private logLifecycle(event: string, metadata: Record<string, unknown>) {
    if (!this.isPrototypeRuntimeEnabled()) {
      return;
    }

    this.logger.log(
      JSON.stringify({
        event,
        ...metadata,
        ...this.createLifecycleCounts(),
      }),
    );
  }
}
