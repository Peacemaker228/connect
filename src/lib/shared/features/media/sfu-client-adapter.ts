'use client'

import { Device, type types as mediasoupClientTypes } from 'mediasoup-client'
import {
  consumeMediasoupPrototypeTrack,
  connectMediasoupPrototypeTransport,
  createMediasoupPrototypeTransport,
  getMediasoupPrototypeHealth,
  produceMediasoupPrototypeTrack,
  type MediasoupPrototypeConsumerResponse,
  type MediasoupPrototypeProducerResponse,
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
  iceTransportPolicy?: RTCIceTransportPolicy
}

export type ProduceSfuClientTrackInput = {
  transportId?: string
  appData?: mediasoupClientTypes.AppData
  stopTracks?: boolean
}

export type SfuClientProducerBundle = {
  backendProducer: MediasoupPrototypeProducerResponse
  producer: mediasoupClientTypes.Producer<mediasoupClientTypes.AppData>
}

export type CreateSfuClientConsumerMetadataInput = {
  transportId?: string
  producerId: string
  paused?: boolean
}

export type ConsumeSfuClientMetadataInput = {
  transportId?: string
}

export type SfuClientConsumerBundle = {
  backendConsumer: MediasoupPrototypeConsumerResponse
  consumer: mediasoupClientTypes.Consumer<mediasoupClientTypes.AppData>
  track: MediaStreamTrack
}

export class SfuClientAdapter {
  private device: Device | null = null
  private readonly transports = new Map<string, mediasoupClientTypes.Transport<SfuClientTransportAppData>>()
  private readonly backendProducers = new Map<string, MediasoupPrototypeProducerResponse>()
  private readonly producers = new Map<string, mediasoupClientTypes.Producer<mediasoupClientTypes.AppData>>()
  private readonly consumers = new Map<string, mediasoupClientTypes.Consumer<mediasoupClientTypes.AppData>>()

  async createTransport({
    direction,
    includeTurnCredentials = true,
    iceTransportPolicy,
  }: CreateSfuClientTransportInput): Promise<SfuClientTransportBundle> {
    const device = await this.getLoadedDevice()
    const backendTransport = await createMediasoupPrototypeTransport({
      direction,
      includeTurnCredentials,
    })
    const transportOptions = this.toTransportOptions(backendTransport, direction, iceTransportPolicy)
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

    if (direction === 'send') {
      this.bindProduceEvent(transport)
    }

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

  async produce(track: MediaStreamTrack, input: ProduceSfuClientTrackInput = {}): Promise<SfuClientProducerBundle> {
    const transport = this.getTransportForDirection('send', input.transportId)
    const producer = await transport.produce({
      track,
      appData: {
        provider: 'mediasoup-prototype',
        trackKind: track.kind,
        ...input.appData,
      },
      stopTracks: input.stopTracks,
    })
    const backendProducer = this.backendProducers.get(producer.id)

    if (!backendProducer) {
      producer.close()
      throw new Error('mediasoup backend producer metadata was not created')
    }

    this.producers.set(producer.id, producer)

    producer.observer.on('close', () => {
      this.producers.delete(producer.id)
      this.backendProducers.delete(producer.id)
    })

    return {
      backendProducer,
      producer,
    }
  }

  async createConsumerMetadata({
    transportId,
    producerId,
    paused = false,
  }: CreateSfuClientConsumerMetadataInput): Promise<MediasoupPrototypeConsumerResponse> {
    const device = await this.getLoadedDevice()
    const transport = this.getTransportForDirection('recv', transportId)

    return consumeMediasoupPrototypeTrack({
      transportId: transport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities as Record<string, unknown>,
      paused,
    })
  }

  async consume(
    metadata: MediasoupPrototypeConsumerResponse,
    input: ConsumeSfuClientMetadataInput = {},
  ): Promise<SfuClientConsumerBundle> {
    const transport = this.getTransportForDirection('recv', input.transportId ?? metadata.transportId)

    if (
      !metadata.enabled ||
      metadata.status !== 'ready' ||
      !metadata.consumerId ||
      !metadata.producerId ||
      !metadata.kind ||
      !metadata.rtpParameters
    ) {
      throw new Error(metadata.reason ?? 'mediasoup consumer metadata is not available')
    }

    const consumer = await transport.consume({
      id: metadata.consumerId,
      producerId: metadata.producerId,
      kind: metadata.kind,
      rtpParameters: metadata.rtpParameters as mediasoupClientTypes.RtpParameters,
      appData: {
        provider: 'mediasoup-prototype',
        producerId: metadata.producerId,
      },
    })

    this.consumers.set(consumer.id, consumer)

    consumer.observer.on('close', () => {
      this.consumers.delete(consumer.id)
    })

    return {
      backendConsumer: metadata,
      consumer,
      track: consumer.track,
    }
  }

  close() {
    for (const consumer of this.consumers.values()) {
      consumer.close()
    }

    for (const producer of this.producers.values()) {
      producer.close()
    }

    for (const transport of this.transports.values()) {
      transport.close()
    }

    this.consumers.clear()
    this.producers.clear()
    this.backendProducers.clear()
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
    iceTransportPolicy?: RTCIceTransportPolicy,
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
      iceTransportPolicy,
      appData: {
        provider: 'mediasoup-prototype',
        direction,
      },
    }
  }

  private bindProduceEvent(transport: mediasoupClientTypes.Transport<SfuClientTransportAppData>) {
    transport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
      void produceMediasoupPrototypeTrack({
        transportId: transport.id,
        kind,
        rtpParameters: rtpParameters as Record<string, unknown>,
      })
        .then((result) => {
          if (!result.enabled || result.status !== 'ready' || !result.producerId) {
            throw new Error(result.reason ?? 'mediasoup produce was not accepted')
          }

          this.backendProducers.set(result.producerId, result)
          callback({ id: result.producerId })
        })
        .catch((error: unknown) => {
          errback(error instanceof Error ? error : new Error('mediasoup produce failed'))
        })
    })
  }

  private getTransportForDirection(
    direction: MediasoupPrototypeTransportDirection,
    transportId?: string,
  ): mediasoupClientTypes.Transport<SfuClientTransportAppData> {
    if (transportId) {
      const transport = this.transports.get(transportId)

      if (transport && !transport.closed && transport.appData.direction === direction) {
        return transport
      }
    }

    for (const transport of this.transports.values()) {
      if (!transport.closed && transport.appData.direction === direction) {
        return transport
      }
    }

    throw new Error(`A mediasoup ${direction} transport has not been created`)
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
