'use client'

import { Device, type types as mediasoupClientTypes } from 'mediasoup-client'
import {
  closeMediasoupPrototypeConsumer,
  closeMediasoupPrototypeProducer,
  closeMediasoupPrototypeTransport,
  consumeMediasoupPrototypeTrack,
  connectMediasoupPrototypeTransport,
  createMediasoupPrototypeEventSource,
  createMediasoupPrototypeTransport,
  discoverMediasoupPrototypeProducers,
  getMediasoupPrototypeHealth,
  heartbeatMediasoupPrototypeSession,
  pauseMediasoupPrototypeProducer,
  produceMediasoupPrototypeTrack,
  resumeMediasoupPrototypeConsumer,
  resumeMediasoupPrototypeProducer,
  type MediasoupPrototypeConsumerResponse,
  type MediasoupPrototypeEvent,
  type MediasoupPrototypeProducerDiscoveryResponse,
  type MediasoupPrototypeProducerResponse,
  type MediasoupPrototypeTrackSource,
  type MediasoupPrototypeTransportDirection,
  type MediasoupPrototypeTransportResponse,
} from '@sdk/actions/media'

export type SfuClientSessionScope = {
  roomId: string
  participantSessionId: string
}

type SfuClientTransportAppData = {
  provider: 'mediasoup-prototype'
  direction: MediasoupPrototypeTransportDirection
  roomId?: string
  participantSessionId?: string
}

type SfuClientTransportConnectionState =
  | 'new'
  | 'checking'
  | 'connecting'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed'

export type SfuClientTransportDiagnostics = {
  transportId: string
  direction: MediasoupPrototypeTransportDirection
  connectionState: string
  iceTransportPolicy: RTCIceTransportPolicy | 'all'
  serverIceCandidateCount: number
  serverIceCandidateProtocols: string[]
  serverIceCandidateTypes: string[]
  turnIceServerCount: number
  turnUrlSchemeCount: number
  turnUrlSchemes: string[]
  turnUrlTransportHints: string[]
  connectEventFired: boolean
  connectAccepted: boolean
  connectError?: string
  selectedCandidatePairState?: string
  selectedLocalCandidateType?: string
  selectedLocalCandidateProtocol?: string
  selectedLocalCandidateRelayProtocol?: string
  selectedRemoteCandidateType?: string
  selectedRemoteCandidateProtocol?: string
  selectedRemoteCandidateRelayProtocol?: string
  localCandidateTypes: string[]
  localCandidateProtocols: string[]
}

type MutableSfuClientTransportDiagnostics = SfuClientTransportDiagnostics

export type SfuClientTransportBundle = {
  direction: MediasoupPrototypeTransportDirection
  backendTransport: MediasoupPrototypeTransportResponse
  transport: mediasoupClientTypes.Transport<SfuClientTransportAppData>
}

export type CreateSfuClientTransportInput = {
  direction: MediasoupPrototypeTransportDirection
  includeTurnCredentials?: boolean
  iceTransportPolicy?: RTCIceTransportPolicy
  sessionScope?: SfuClientSessionScope
}

export type ProduceSfuClientTrackInput = {
  transportId?: string
  sessionScope?: SfuClientSessionScope
  source?: MediasoupPrototypeTrackSource
  appData?: mediasoupClientTypes.AppData
  stopTracks?: boolean
}

export type SfuClientProducerBundle = {
  backendProducer: MediasoupPrototypeProducerResponse
  producer: mediasoupClientTypes.Producer<mediasoupClientTypes.AppData>
}

export type CreateSfuClientConsumerMetadataInput = {
  transportId?: string
  sessionScope?: SfuClientSessionScope
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
  private readonly backendConsumers = new Map<string, MediasoupPrototypeConsumerResponse>()
  private readonly consumers = new Map<string, mediasoupClientTypes.Consumer<mediasoupClientTypes.AppData>>()
  private readonly transportDiagnostics = new Map<string, MutableSfuClientTransportDiagnostics>()

  async createTransport({
    direction,
    includeTurnCredentials = true,
    iceTransportPolicy,
    sessionScope,
  }: CreateSfuClientTransportInput): Promise<SfuClientTransportBundle> {
    const device = await this.getLoadedDevice()
    const backendTransport = await createMediasoupPrototypeTransport({
      direction,
      includeTurnCredentials,
      roomId: sessionScope?.roomId,
      participantSessionId: sessionScope?.participantSessionId,
    })
    const transportOptions = this.toTransportOptions(backendTransport, direction, iceTransportPolicy, sessionScope)
    const transport =
      direction === 'recv' ? device.createRecvTransport(transportOptions) : device.createSendTransport(transportOptions)
    const diagnostics = this.createTransportDiagnostics(
      backendTransport,
      direction,
      iceTransportPolicy,
      transportOptions.iceServers,
    )

    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      diagnostics.connectEventFired = true
      void connectMediasoupPrototypeTransport(transport.id, {
        roomId: transport.appData.roomId,
        participantSessionId: transport.appData.participantSessionId,
        dtlsParameters: dtlsParameters as Record<string, unknown>,
      })
        .then((result) => {
          if (!result.enabled || result.status !== 'ready') {
            throw new Error(result.reason ?? 'mediasoup transport connect was not accepted')
          }

          diagnostics.connectAccepted = true
          callback()
        })
        .catch((error: unknown) => {
          diagnostics.connectError = error instanceof Error ? error.message : 'mediasoup transport connect failed'
          errback(error instanceof Error ? error : new Error('mediasoup transport connect failed'))
        })
    })

    if (direction === 'send') {
      this.bindProduceEvent(transport)
    }

    transport.observer.on('close', () => {
      this.transports.delete(transport.id)
      this.transportDiagnostics.delete(transport.id)
    })

    this.transports.set(transport.id, transport)
    this.transportDiagnostics.set(transport.id, diagnostics)

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
        trackSource: input.source,
        roomId: input.sessionScope?.roomId,
        participantSessionId: input.sessionScope?.participantSessionId,
        paused: !track.enabled,
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
    sessionScope,
    producerId,
    paused = true,
  }: CreateSfuClientConsumerMetadataInput): Promise<MediasoupPrototypeConsumerResponse> {
    const device = await this.getLoadedDevice()
    const transport = this.getTransportForDirection('recv', transportId)

    return consumeMediasoupPrototypeTrack({
      transportId: transport.id,
      roomId: sessionScope?.roomId ?? transport.appData.roomId,
      participantSessionId: sessionScope?.participantSessionId ?? transport.appData.participantSessionId,
      producerId,
      rtpCapabilities: device.rtpCapabilities as Record<string, unknown>,
      paused,
    })
  }

  async discoverProducers(sessionScope: SfuClientSessionScope): Promise<MediasoupPrototypeProducerDiscoveryResponse> {
    return discoverMediasoupPrototypeProducers(sessionScope)
  }

  createProducerEventSource(sessionScope: SfuClientSessionScope): EventSource {
    return createMediasoupPrototypeEventSource(sessionScope)
  }

  async heartbeatSession(sessionScope: SfuClientSessionScope) {
    return heartbeatMediasoupPrototypeSession(sessionScope)
  }

  async setProducerTrackEnabled(kind: MediaStreamTrack['kind'], enabled: boolean, source?: MediasoupPrototypeTrackSource) {
    const producerUpdates: Array<Promise<unknown>> = []

    for (const producer of this.producers.values()) {
      const appData = producer.appData as {
        trackKind?: MediaStreamTrack['kind']
        trackSource?: MediasoupPrototypeTrackSource
      }

      if (appData.trackKind !== kind) {
        continue
      }

      if (source && appData.trackSource !== source) {
        continue
      }

      if (producer.track) {
        producer.track.enabled = enabled
      }

      if (enabled) {
        producer.resume()
      } else {
        producer.pause()
      }

      const backendProducer = this.backendProducers.get(producer.id)

      if (backendProducer?.roomId && backendProducer.participantSessionId) {
        const payload = {
          roomId: backendProducer.roomId,
          participantSessionId: backendProducer.participantSessionId,
        }

        producerUpdates.push(
          enabled
            ? resumeMediasoupPrototypeProducer(producer.id, payload)
            : pauseMediasoupPrototypeProducer(producer.id, payload),
        )
      }
    }

    await Promise.all(producerUpdates)
  }

  async closeProducer(producerId: string, sessionScope?: SfuClientSessionScope) {
    const producer = this.producers.get(producerId)
    const backendProducer = this.backendProducers.get(producerId)

    if (backendProducer?.producerId) {
      await closeMediasoupPrototypeProducer(backendProducer.producerId, {
        roomId: sessionScope?.roomId ?? backendProducer.roomId,
        participantSessionId: sessionScope?.participantSessionId ?? backendProducer.participantSessionId,
      })
    }

    producer?.close()
    this.producers.delete(producerId)
    this.backendProducers.delete(producerId)
  }

  closeLocalProducer(producerId: string) {
    const producer = this.producers.get(producerId)

    producer?.close()
    this.producers.delete(producerId)
    this.backendProducers.delete(producerId)
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

    const resumeResult = await resumeMediasoupPrototypeConsumer(metadata.consumerId, {
      roomId: metadata.roomId ?? transport.appData.roomId,
      participantSessionId: metadata.participantSessionId ?? transport.appData.participantSessionId,
    })

    if (!resumeResult.enabled || resumeResult.status !== 'ready') {
      consumer.close()
      throw new Error(resumeResult.reason ?? 'mediasoup consumer resume was not accepted')
    }

    consumer.resume()

    this.consumers.set(consumer.id, consumer)
    this.backendConsumers.set(consumer.id, resumeResult)

    consumer.observer.on('close', () => {
      this.consumers.delete(consumer.id)
      this.backendConsumers.delete(consumer.id)
    })

    return {
      backendConsumer: resumeResult,
      consumer,
      track: consumer.track,
    }
  }

  async waitForTransportConnected(transportId: string | undefined, timeoutMs = 8000) {
    if (!transportId) {
      throw new Error('mediasoup transport id is missing')
    }

    const transport = this.transports.get(transportId)

    if (!transport || transport.closed) {
      throw new Error('mediasoup transport is not available')
    }

    const initialConnectionState = transport.connectionState as SfuClientTransportConnectionState

    if (initialConnectionState === 'connected' || initialConnectionState === 'completed') {
      return initialConnectionState
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error(`mediasoup transport did not connect: ${transport.connectionState}`))
      }, timeoutMs)

      const handleStateChange = (state: SfuClientTransportConnectionState) => {
        if (state === 'connected' || state === 'completed') {
          cleanup()
          resolve()
          return
        }

        if (state === 'failed' || state === 'closed') {
          cleanup()
          reject(new Error(`mediasoup transport connection ${state}`))
        }
      }

      const cleanup = () => {
        window.clearTimeout(timeout)
        transport.off('connectionstatechange', handleStateChange)
      }

      transport.on('connectionstatechange', handleStateChange)
      handleStateChange(transport.connectionState as SfuClientTransportConnectionState)
    })

    return transport.connectionState
  }

  async getTransportDiagnostics(transportId: string | undefined): Promise<SfuClientTransportDiagnostics | undefined> {
    if (!transportId) {
      return undefined
    }

    const transport = this.transports.get(transportId)
    const diagnostics = this.transportDiagnostics.get(transportId)

    if (!diagnostics) {
      return undefined
    }

    if (transport && !transport.closed) {
      diagnostics.connectionState = transport.connectionState
      await this.populateTransportStatsDiagnostics(transport, diagnostics)
    }

    return {
      ...diagnostics,
      serverIceCandidateProtocols: [...diagnostics.serverIceCandidateProtocols],
      serverIceCandidateTypes: [...diagnostics.serverIceCandidateTypes],
      turnUrlSchemes: [...diagnostics.turnUrlSchemes],
      turnUrlTransportHints: [...diagnostics.turnUrlTransportHints],
      localCandidateTypes: [...diagnostics.localCandidateTypes],
      localCandidateProtocols: [...diagnostics.localCandidateProtocols],
    }
  }

  async close() {
    const closeResourceRequests: Array<Promise<unknown>> = []
    const closeTransportRequests: Array<Promise<unknown>> = []

    for (const backendConsumer of this.backendConsumers.values()) {
      if (!backendConsumer.consumerId) {
        continue
      }

      closeResourceRequests.push(
        closeMediasoupPrototypeConsumer(backendConsumer.consumerId, {
          roomId: backendConsumer.roomId,
          participantSessionId: backendConsumer.participantSessionId,
        }),
      )
    }

    for (const backendProducer of this.backendProducers.values()) {
      if (!backendProducer.producerId) {
        continue
      }

      closeResourceRequests.push(
        closeMediasoupPrototypeProducer(backendProducer.producerId, {
          roomId: backendProducer.roomId,
          participantSessionId: backendProducer.participantSessionId,
        }),
      )
    }

    for (const transport of this.transports.values()) {
      closeTransportRequests.push(
        closeMediasoupPrototypeTransport(transport.id, {
          roomId: transport.appData.roomId,
          participantSessionId: transport.appData.participantSessionId,
        }),
      )
    }

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
    this.backendConsumers.clear()
    this.producers.clear()
    this.backendProducers.clear()
    this.transports.clear()
    this.transportDiagnostics.clear()
    this.device = null

    await Promise.allSettled(closeResourceRequests)
    await Promise.allSettled(closeTransportRequests)
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
    sessionScope?: SfuClientSessionScope,
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
        roomId: sessionScope?.roomId,
        participantSessionId: sessionScope?.participantSessionId,
      },
    }
  }

  private bindProduceEvent(transport: mediasoupClientTypes.Transport<SfuClientTransportAppData>) {
    transport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
      const scopedAppData =
        appData as {
          roomId?: string
          participantSessionId?: string
          paused?: boolean
          trackSource?: MediasoupPrototypeTrackSource
        } | undefined

      void produceMediasoupPrototypeTrack({
        transportId: transport.id,
        roomId: scopedAppData?.roomId ?? transport.appData.roomId,
        participantSessionId: scopedAppData?.participantSessionId ?? transport.appData.participantSessionId,
        kind,
        source: scopedAppData?.trackSource,
        rtpParameters: rtpParameters as Record<string, unknown>,
        paused: scopedAppData?.paused,
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

  private createTransportDiagnostics(
    backendTransport: MediasoupPrototypeTransportResponse,
    direction: MediasoupPrototypeTransportDirection,
    iceTransportPolicy: RTCIceTransportPolicy | undefined,
    iceServers: RTCIceServer[] | undefined,
  ): MutableSfuClientTransportDiagnostics {
    const serverCandidates = backendTransport.iceCandidates ?? []
    const turnUrls = iceServers?.flatMap((server) => this.normalizeIceServerUrls(server.urls)) ?? []

    return {
      transportId: backendTransport.transportId ?? 'unknown',
      direction,
      connectionState: 'new',
      iceTransportPolicy: iceTransportPolicy ?? 'all',
      serverIceCandidateCount: serverCandidates.length,
      serverIceCandidateProtocols: this.uniqueStrings(
        serverCandidates.map((candidate) => this.readString(candidate.protocol)),
      ),
      serverIceCandidateTypes: this.uniqueStrings(
        serverCandidates.map((candidate) => this.readString(candidate.type)),
      ),
      turnIceServerCount: iceServers?.length ?? 0,
      turnUrlSchemeCount: turnUrls.length,
      turnUrlSchemes: this.uniqueStrings(turnUrls.map((url) => this.readUrlScheme(url))),
      turnUrlTransportHints: this.uniqueStrings(turnUrls.map((url) => this.readTurnTransportHint(url))),
      connectEventFired: false,
      connectAccepted: false,
      localCandidateTypes: [],
      localCandidateProtocols: [],
    }
  }

  private async populateTransportStatsDiagnostics(
    transport: mediasoupClientTypes.Transport<SfuClientTransportAppData>,
    diagnostics: MutableSfuClientTransportDiagnostics,
  ) {
    let stats: RTCStatsReport

    try {
      stats = await transport.getStats()
    } catch {
      return
    }

    const records = new Map<string, Record<string, unknown>>()

    stats.forEach((value, key) => {
      records.set(key, value as unknown as Record<string, unknown>)
    })

    const localCandidates = [...records.values()].filter((record) => record.type === 'local-candidate')
    diagnostics.localCandidateTypes = this.uniqueStrings(
      localCandidates.map((candidate) => this.readString(candidate.candidateType)),
    )
    diagnostics.localCandidateProtocols = this.uniqueStrings(
      localCandidates.map((candidate) => this.readString(candidate.protocol)),
    )

    const selectedPair = this.findSelectedCandidatePair(records)

    if (!selectedPair) {
      return
    }

    diagnostics.selectedCandidatePairState = this.readString(selectedPair.state)

    const localCandidateId = this.readString(selectedPair.localCandidateId)
    const remoteCandidateId = this.readString(selectedPair.remoteCandidateId)
    const localCandidate = localCandidateId ? records.get(localCandidateId) : undefined
    const remoteCandidate = remoteCandidateId ? records.get(remoteCandidateId) : undefined

    diagnostics.selectedLocalCandidateType = this.readString(localCandidate?.candidateType)
    diagnostics.selectedLocalCandidateProtocol = this.readString(localCandidate?.protocol)
    diagnostics.selectedLocalCandidateRelayProtocol = this.readString(localCandidate?.relayProtocol)
    diagnostics.selectedRemoteCandidateType = this.readString(remoteCandidate?.candidateType)
    diagnostics.selectedRemoteCandidateProtocol = this.readString(remoteCandidate?.protocol)
    diagnostics.selectedRemoteCandidateRelayProtocol = this.readString(remoteCandidate?.relayProtocol)
  }

  private findSelectedCandidatePair(records: Map<string, Record<string, unknown>>) {
    const pairs = [...records.values()].filter((record) => record.type === 'candidate-pair')

    return (
      pairs.find((pair) => pair.selected === true) ??
      pairs.find((pair) => pair.nominated === true && pair.state === 'succeeded') ??
      pairs.find((pair) => pair.state === 'succeeded') ??
      pairs.find((pair) => pair.state === 'in-progress' || pair.state === 'inprogress')
    )
  }

  private normalizeIceServerUrls(urls: string | string[]) {
    return Array.isArray(urls) ? urls : [urls]
  }

  private readUrlScheme(url: string) {
    const scheme = url.split(':')[0]?.toLowerCase()

    return scheme === 'turn' || scheme === 'turns' ? scheme : 'unknown'
  }

  private readTurnTransportHint(url: string) {
    try {
      const parsedUrl = new URL(url)
      const transport = parsedUrl.searchParams.get('transport')?.toLowerCase()

      return transport || 'unspecified'
    } catch {
      const transportMatch = /[?&]transport=([^&]+)/i.exec(url)

      return transportMatch?.[1]?.toLowerCase() || 'unspecified'
    }
  }

  private uniqueStrings(values: Array<string | undefined>) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))].sort()
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
  }
}

export type { MediasoupPrototypeEvent }
