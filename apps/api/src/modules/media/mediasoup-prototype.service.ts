import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, version as mediasoupVersion, workerBin } from 'mediasoup';
import type { types as mediasoupTypes } from 'mediasoup';

import { MediaSignalingService } from './media-signaling.service';
import { MediaParticipantSessionService } from './media-participant-session.service';

type LocalMediasoupPrototypeStatus = 'disabled' | 'ready' | 'failed';
type LocalMediasoupTransportDirection = 'send' | 'recv';

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
  reason?: string;
};

export type LocalMediasoupTransportMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  direction?: LocalMediasoupTransportDirection;
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

export type LocalMediasoupProducerMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  roomId?: string;
  participantSessionId?: string;
  producerId?: string;
  kind?: mediasoupTypes.MediaKind;
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
  constructor(
    private readonly mediaSignalingService: MediaSignalingService,
    private readonly mediaParticipantSessionService: MediaParticipantSessionService,
  ) {}

  private worker: mediasoupTypes.Worker | null = null;
  private router: mediasoupTypes.Router | null = null;
  private readonly transports = new Map<string, mediasoupTypes.WebRtcTransport>();
  private readonly transportDirections = new Map<string, LocalMediasoupTransportDirection>();
  private readonly transportScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly producers = new Map<string, mediasoupTypes.Producer>();
  private readonly producerScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly producerCreatedAt = new Map<string, string>();
  private readonly consumers = new Map<string, mediasoupTypes.Consumer>();
  private readonly consumerScopes = new Map<string, LocalMediasoupSessionScope>();
  private readonly consumerProducerIds = new Map<string, string>();
  private lastFailure: string | null = null;

  async getHealth(): Promise<LocalMediasoupPrototypeHealth> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'disabled',
        enabled: false,
        version: mediasoupVersion,
        workerBin,
        reason: 'Local mediasoup prototype is disabled in production runtime',
      };
    }

    try {
      await this.ensurePrototypeRouter();
      this.lastFailure = null;

      return this.createHealthSnapshot('ready');
    } catch (error) {
      this.lastFailure = error instanceof Error ? error.message : 'Unknown mediasoup prototype failure';

      return this.createHealthSnapshot('failed');
    }
  }

  onModuleDestroy() {
    this.router?.close();
    this.worker?.close();
    this.clearPrototypeState();
    this.router = null;
    this.worker = null;
  }

  async createWebRtcTransport({
    direction,
    scope,
  }: {
    direction: LocalMediasoupTransportDirection;
    scope?: LocalMediasoupSessionScope;
  }): Promise<LocalMediasoupTransportMetadata> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'disabled',
        enabled: false,
        direction,
        reason: 'Local mediasoup transport prototype is disabled in production runtime',
      };
    }

    try {
      await this.ensurePrototypeRouter();

      if (!this.router || this.router.closed) {
        return {
          status: 'failed',
          enabled: false,
          direction,
          reason: 'Local mediasoup router is not available',
        };
      }

      const transport = await this.router.createWebRtcTransport({
        listenInfos: this.getLocalListenInfos(),
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 600000,
        appData: {
          prototype: 'local-mediasoup',
          direction,
          roomId: scope?.roomId,
          participantSessionId: scope?.participantSessionId,
        },
      });

      this.transports.set(transport.id, transport);
      this.transportDirections.set(transport.id, direction);

      if (scope) {
        this.transportScopes.set(transport.id, scope);
      }

      transport.observer.on('close', () => {
        this.transports.delete(transport.id);
        this.transportDirections.delete(transport.id);
        this.transportScopes.delete(transport.id);
      });

      return {
        status: 'ready',
        enabled: true,
        direction,
        transportId: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
      };
    } catch (error) {
      return {
        status: 'failed',
        enabled: false,
        direction,
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
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        reason: 'Local mediasoup transport prototype is disabled in production runtime',
      };
    }

    if (!transportId) {
      return {
        status: 'failed',
        enabled: false,
        reason: 'transportId is required',
      };
    }

    if (!dtlsParameters) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: 'dtlsParameters are required',
      };
    }

    const scopeCheck = this.validateTransportScope(transportId, scope);

    if (!scopeCheck.enabled) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: scopeCheck.reason,
      };
    }

    const transport = this.transports.get(transportId);

    if (!transport || transport.closed) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: 'Local mediasoup transport was not found',
      };
    }

    try {
      await transport.connect({ dtlsParameters });

      return {
        status: 'ready',
        enabled: true,
        transportId,
        dtlsState: transport.dtlsState,
      };
    } catch (error) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        dtlsState: transport.dtlsState,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup transport connect failure',
      };
    }
  }

  async produce({
    transportId,
    scope,
    kind,
    rtpParameters,
    paused,
  }: {
    transportId: string | undefined;
    scope?: LocalMediasoupSessionScope;
    kind: mediasoupTypes.MediaKind | undefined;
    rtpParameters: mediasoupTypes.RtpParameters | undefined;
    paused?: boolean;
  }): Promise<LocalMediasoupProducerMetadata> {
    if (process.env.NODE_ENV === 'production') {
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
        },
      });

      this.producers.set(producer.id, producer);
      const createdAt = new Date().toISOString();

      this.producerCreatedAt.set(producer.id, createdAt);

      if (scope) {
        this.producerScopes.set(producer.id, scope);
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
          paused: producer.paused,
          createdAt,
        });
      }

      return {
        status: 'ready',
        enabled: true,
        transportId,
        roomId: scope?.roomId,
        participantSessionId: scope?.participantSessionId,
        producerId: producer.id,
        kind: producer.kind,
        paused: producer.paused,
      };
    } catch (error) {
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
    if (process.env.NODE_ENV === 'production') {
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

      if (scope) {
        this.consumerScopes.set(consumer.id, scope);
      }

      consumer.observer.on('close', () => {
        this.removeConsumerState(consumer.id);
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

  closeProducer({
    producerId,
    scope,
  }: {
    producerId: string | undefined;
    scope?: LocalMediasoupSessionScope;
  }): LocalMediasoupProducerMetadata {
    if (process.env.NODE_ENV === 'production') {
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

    producer.close();
    this.removeProducerState(producerId);

    return {
      status: 'ready',
      enabled: true,
      producerId,
      roomId: producerScope?.roomId ?? scope?.roomId,
      participantSessionId: producerScope?.participantSessionId ?? scope?.participantSessionId,
      kind: producer.kind,
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
    if (process.env.NODE_ENV === 'production') {
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

  listProducers(scope: LocalMediasoupSessionScope | undefined): LocalMediasoupProducerDiscoveryResult {
    if (process.env.NODE_ENV === 'production') {
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
      const discoveryMetadata: LocalMediasoupProducerDiscoveryMetadata = {
        producerId,
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        kind: producer.kind,
        paused: producer.paused,
        createdAt,
      };
      const ownerAndKindKey = `${producerScope.participantSessionId}:${producer.kind}`;
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

  private getLocalListenInfos(): mediasoupTypes.TransportListenInfo[] {
    const ip = process.env.LOCAL_MEDIASOUP_LISTEN_IP?.trim() || '127.0.0.1';
    const announcedAddress = process.env.LOCAL_MEDIASOUP_ANNOUNCED_ADDRESS?.trim() || undefined;

    return [
      {
        protocol: 'udp',
        ip,
        announcedAddress,
      },
      {
        protocol: 'tcp',
        ip,
        announcedAddress,
      },
    ];
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

    this.producers.delete(producerId);
    this.producerScopes.delete(producerId);
    this.producerCreatedAt.delete(producerId);

    if (producerScope && producer) {
      this.mediaSignalingService.publishProducerClosed({
        roomId: producerScope.roomId,
        participantSessionId: producerScope.participantSessionId,
        producerId,
      });
    }
  }

  private removeConsumerState(consumerId: string) {
    const consumerScope = this.consumerScopes.get(consumerId);
    const producerId = this.consumerProducerIds.get(consumerId);

    this.consumers.delete(consumerId);
    this.consumerScopes.delete(consumerId);
    this.consumerProducerIds.delete(consumerId);

    if (consumerScope) {
      this.mediaSignalingService.publishConsumerClosed({
        roomId: consumerScope.roomId,
        participantSessionId: consumerScope.participantSessionId,
        consumerId,
        producerId,
      });
    }
  }

  private clearPrototypeState() {
    this.consumerProducerIds.clear();
    this.consumerScopes.clear();
    this.consumers.clear();
    this.producerCreatedAt.clear();
    this.producerScopes.clear();
    this.producers.clear();
    this.transportScopes.clear();
    this.transportDirections.clear();
    this.transports.clear();
  }

  closeSession(scope: LocalMediasoupSessionScope) {
    for (const [consumerId, consumerScope] of this.consumerScopes.entries()) {
      if (
        consumerScope.roomId === scope.roomId &&
        consumerScope.participantSessionId === scope.participantSessionId
      ) {
        this.consumers.get(consumerId)?.close();
        this.removeConsumerState(consumerId);
      }
    }

    for (const [producerId, producerScope] of this.producerScopes.entries()) {
      if (
        producerScope.roomId === scope.roomId &&
        producerScope.participantSessionId === scope.participantSessionId
      ) {
        this.producers.get(producerId)?.close();
        this.removeProducerState(producerId);
      }
    }

    for (const [transportId, transportScope] of this.transportScopes.entries()) {
      if (
        transportScope.roomId === scope.roomId &&
        transportScope.participantSessionId === scope.participantSessionId
      ) {
        this.transports.get(transportId)?.close();
        this.transports.delete(transportId);
        this.transportDirections.delete(transportId);
        this.transportScopes.delete(transportId);
      }
    }
  }

  private createHealthSnapshot(status: LocalMediasoupPrototypeStatus): LocalMediasoupPrototypeHealth {
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
      reason: status === 'failed' ? this.lastFailure ?? undefined : undefined,
    };
  }
}
