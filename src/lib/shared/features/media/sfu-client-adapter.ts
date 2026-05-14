'use client'

import { Device, type types as mediasoupClientTypes } from 'mediasoup-client'
import {
  connectMediasoupPrototypeTransport,
  createMediasoupPrototypeTransport,
  getMediasoupPrototypeHealth,
  type MediasoupPrototypeTransportDirection,
  type MediasoupPrototypeTransportResponse,
} from '@sdk/actions/media'

type SfuClientTransportAppData = {
  provider: 'mediasoup-prototype'
  direction: MediasoupPrototypeTransportDirection
}

export type SfuClientTransportBundle = {
  direction: MediasoupPrototypeTransportDirection
  backendTransport: MediasoupPrototypeTransportResponse
  transport: mediasoupClientTypes.Transport<SfuClientTransportAppData>
}

export type CreateSfuClientTransportInput = {
  direction: MediasoupPrototypeTransportDirection
  includeTurnCredentials?: boolean
}

export class SfuClientAdapter {
  private device: Device | null = null
  private readonly transports = new Map<string, mediasoupClientTypes.Transport<SfuClientTransportAppData>>()

  async createTransport({
    direction,
    includeTurnCredentials = true,
  }: CreateSfuClientTransportInput): Promise<SfuClientTransportBundle> {
    const device = await this.getLoadedDevice()
    const backendTransport = await createMediasoupPrototypeTransport({
      direction,
      includeTurnCredentials,
    })
    const transportOptions = this.toTransportOptions(backendTransport, direction)
    const transport =
      direction === 'recv' ? device.createRecvTransport(transportOptions) : device.createSendTransport(transportOptions)

    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      void connectMediasoupPrototypeTransport(transport.id, {
        dtlsParameters: dtlsParameters as Record<string, unknown>,
      })
        .then((result) => {
          if (!result.enabled || result.status !== 'ready') {
            throw new Error(result.reason ?? 'mediasoup transport connect was not accepted')
          }

          callback()
        })
        .catch((error: unknown) => {
          errback(error instanceof Error ? error : new Error('mediasoup transport connect failed'))
        })
    })

    transport.observer.on('close', () => {
      this.transports.delete(transport.id)
    })

    this.transports.set(transport.id, transport)

    return {
      direction,
      backendTransport,
      transport,
    }
  }

  close() {
    for (const transport of this.transports.values()) {
      transport.close()
    }

    this.transports.clear()
    this.device = null
  }

  private async getLoadedDevice() {
    if (this.device?.loaded) {
      return this.device
    }

    const health = await getMediasoupPrototypeHealth()

    if (!health.enabled || health.status !== 'ready' || !health.routerRtpCapabilities) {
      throw new Error(health.reason ?? 'mediasoup prototype router capabilities are not available')
    }

    const device = new Device()

    await device.load({
      routerRtpCapabilities: health.routerRtpCapabilities as mediasoupClientTypes.RtpCapabilities,
    })

    this.device = device

    return device
  }

  private toTransportOptions(
    backendTransport: MediasoupPrototypeTransportResponse,
    direction: MediasoupPrototypeTransportDirection,
  ): mediasoupClientTypes.TransportOptions<SfuClientTransportAppData> {
    if (
      !backendTransport.enabled ||
      backendTransport.status !== 'ready' ||
      !backendTransport.transportId ||
      !backendTransport.iceParameters ||
      !backendTransport.iceCandidates ||
      !backendTransport.dtlsParameters
    ) {
      throw new Error(backendTransport.reason ?? 'mediasoup prototype transport metadata is not available')
    }

    return {
      id: backendTransport.transportId,
      iceParameters: backendTransport.iceParameters as mediasoupClientTypes.IceParameters,
      iceCandidates: backendTransport.iceCandidates as mediasoupClientTypes.IceCandidate[],
      dtlsParameters: backendTransport.dtlsParameters as mediasoupClientTypes.DtlsParameters,
      sctpParameters: backendTransport.sctpParameters as mediasoupClientTypes.SctpParameters | undefined,
      iceServers: this.toIceServers(backendTransport),
      appData: {
        provider: 'mediasoup-prototype',
        direction,
      },
    }
  }

  private toIceServers(backendTransport: MediasoupPrototypeTransportResponse): RTCIceServer[] {
    const credentials = backendTransport.turnCredentials

    if (!credentials?.enabled || !credentials.urls?.length || !credentials.username || !credentials.credential) {
      return []
    }

    return [
      {
        urls: credentials.urls,
        username: credentials.username,
        credential: credentials.credential,
      },
    ]
  }
}
