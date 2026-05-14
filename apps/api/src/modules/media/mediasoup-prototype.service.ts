import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, version as mediasoupVersion, workerBin } from 'mediasoup';
import type { types as mediasoupTypes } from 'mediasoup';

type LocalMediasoupPrototypeStatus = 'disabled' | 'ready' | 'failed';
type LocalMediasoupTransportDirection = 'send' | 'recv';

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
  producerId?: string;
  kind?: mediasoupTypes.MediaKind;
  paused?: boolean;
  reason?: string;
};

export type LocalMediasoupConsumerMetadata = {
  status: LocalMediasoupPrototypeStatus;
  enabled: boolean;
  transportId?: string;
  consumerId?: string;
  producerId?: string;
  kind?: mediasoupTypes.MediaKind;
  rtpParameters?: mediasoupTypes.RtpParameters;
  type?: mediasoupTypes.ConsumerType;
  paused?: boolean;
  producerPaused?: boolean;
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
  private worker: mediasoupTypes.Worker | null = null;
  private router: mediasoupTypes.Router | null = null;
  private readonly transports = new Map<string, mediasoupTypes.WebRtcTransport>();
  private readonly transportDirections = new Map<string, LocalMediasoupTransportDirection>();
  private readonly producers = new Map<string, mediasoupTypes.Producer>();
  private readonly consumers = new Map<string, mediasoupTypes.Consumer>();
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

  async createWebRtcTransport(
    direction: LocalMediasoupTransportDirection,
  ): Promise<LocalMediasoupTransportMetadata> {
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
        },
      });

      this.transports.set(transport.id, transport);
      this.transportDirections.set(transport.id, direction);

      transport.observer.on('close', () => {
        this.transports.delete(transport.id);
        this.transportDirections.delete(transport.id);
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
    dtlsParameters,
  }: {
    transportId: string | undefined;
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
    kind,
    rtpParameters,
    paused,
  }: {
    transportId: string | undefined;
    kind: mediasoupTypes.MediaKind | undefined;
    rtpParameters: mediasoupTypes.RtpParameters | undefined;
    paused?: boolean;
  }): Promise<LocalMediasoupProducerMetadata> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
        reason: 'Local mediasoup produce prototype is disabled in production runtime',
      };
    }

    const transport = this.getTransportForDirection(transportId, 'send');

    if (!transport.enabled || !transport.transport) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: transport.reason,
      };
    }

    if (!kind || (kind !== 'audio' && kind !== 'video')) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        reason: 'kind must be audio or video',
      };
    }

    if (!rtpParameters) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
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
        },
      });

      this.producers.set(producer.id, producer);

      producer.observer.on('close', () => {
        this.producers.delete(producer.id);
      });

      return {
        status: 'ready',
        enabled: true,
        transportId,
        producerId: producer.id,
        kind: producer.kind,
        paused: producer.paused,
      };
    } catch (error) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        kind,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup produce failure',
      };
    }
  }

  async consume({
    transportId,
    producerId,
    rtpCapabilities,
    paused = false,
  }: {
    transportId: string | undefined;
    producerId: string | undefined;
    rtpCapabilities: mediasoupTypes.RtpCapabilities | undefined;
    paused?: boolean;
  }): Promise<LocalMediasoupConsumerMetadata> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'disabled',
        enabled: false,
        transportId,
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
        producerId,
        reason: transport.reason,
      };
    }

    if (!producerId || !this.producers.has(producerId)) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        producerId,
        reason: 'producerId was not found',
      };
    }

    if (!rtpCapabilities) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
        producerId,
        reason: 'rtpCapabilities are required',
      };
    }

    if (!this.router?.canConsume({ producerId, rtpCapabilities })) {
      return {
        status: 'failed',
        enabled: false,
        transportId,
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
        },
      });

      this.consumers.set(consumer.id, consumer);

      consumer.observer.on('close', () => {
        this.consumers.delete(consumer.id);
      });

      return {
        status: 'ready',
        enabled: true,
        transportId,
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
        producerId,
        reason: error instanceof Error ? error.message : 'Unknown mediasoup consume failure',
      };
    }
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

  private clearPrototypeState() {
    this.consumers.clear();
    this.producers.clear();
    this.transportDirections.clear();
    this.transports.clear();
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
