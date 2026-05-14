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
    this.transports.clear();
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

      transport.observer.on('close', () => {
        this.transports.delete(transport.id);
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

  private async ensurePrototypeRouter() {
    if (this.worker && !this.worker.closed && this.router && !this.router.closed) {
      return;
    }

    this.router?.close();
    this.worker?.close();

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
      reason: status === 'failed' ? this.lastFailure ?? undefined : undefined,
    };
  }
}
