'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PhoneOff, RotateCcw } from 'lucide-react'
import type { JoinRoomResponse } from '@sdk/actions/media'

import { Button } from '@/lib/shared/ui/button'

import {
  SfuClientAdapter,
  type MediasoupPrototypeEvent,
  type SfuClientSessionScope,
  type SfuClientTransportBundle,
} from './sfu-client-adapter'

type SfuPrivateCallStatus = 'idle' | 'starting' | 'waiting' | 'connected' | 'failed'

type RemoteProducerMetadata = Extract<MediasoupPrototypeEvent, { type: 'producer.published' }>['producer']

type SfuPrivateCallAdapterProps = {
  controlPlaneJoin: JoinRoomResponse
  audio: boolean
  video: boolean
  iceTransportPolicy?: RTCIceTransportPolicy
  onLeave: () => void
}

const waitForRemoteTrackFlow = async (track: MediaStreamTrack) => {
  if (track.readyState !== 'live') {
    throw new Error(`Remote track is ${track.readyState}`)
  }

  if (!track.muted) {
    return
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve()
    }, 5000)

    const handleUnmute = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      track.removeEventListener('unmute', handleUnmute)
    }

    track.addEventListener('unmute', handleUnmute, { once: true })
  })
}

export const SfuPrivateCallAdapter: FC<SfuPrivateCallAdapterProps> = ({
  controlPlaneJoin,
  audio,
  video,
  iceTransportPolicy,
  onLeave,
}) => {
  const adapterRef = useRef<SfuClientAdapter | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const localTrackRef = useRef<MediaStreamTrack | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const consumedProducerIdsRef = useRef(new Set<string>())
  const consumedProducerKeysRef = useRef(new Set<string>())
  const consumedProducerKeyByIdRef = useRef(new Map<string, string>())
  const startRunIdRef = useRef(0)
  const [status, setStatus] = useState<SfuPrivateCallStatus>('idle')
  const [detail, setDetail] = useState('Waiting for SFU private-call gate')
  const [producerId, setProducerId] = useState<string | null>(null)
  const [consumerIds, setConsumerIds] = useState<string[]>([])
  const [remoteProducerIds, setRemoteProducerIds] = useState<string[]>([])

  const sessionScope: SfuClientSessionScope = useMemo(
    () => ({
      roomId: controlPlaneJoin.participantSession.roomId,
      participantSessionId: controlPlaneJoin.participantSession.participantSessionId,
    }),
    [controlPlaneJoin.participantSession.participantSessionId, controlPlaneJoin.participantSession.roomId],
  )

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null

    adapterRef.current?.close()
    adapterRef.current = null
    consumedProducerIdsRef.current.clear()
    consumedProducerKeysRef.current.clear()
    consumedProducerKeyByIdRef.current.clear()
    remoteStreamRef.current = null

    localTrackRef.current?.stop()
    localTrackRef.current = null

    try {
      oscillatorRef.current?.stop()
    } catch {
      // OscillatorNode throws if it has already stopped.
    }

    oscillatorRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  const createSyntheticAudioTrack = useCallback(async () => {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const destination = audioContext.createMediaStreamDestination()

    oscillator.frequency.value = 440
    gain.gain.value = 0.02
    oscillator.connect(gain).connect(destination)
    oscillator.start()

    if (audioContext.state === 'suspended') {
      await Promise.race([
        audioContext.resume().catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 500)),
      ])
    }

    const track = destination.stream.getAudioTracks()[0]

    if (!track) {
      throw new Error('Synthetic audio track was not created')
    }

    audioContextRef.current = audioContext
    oscillatorRef.current = oscillator
    localTrackRef.current = track

    return track
  }, [])

  const assertScopedTransport = useCallback(
    (transport: SfuClientTransportBundle) => {
      if (!transport.backendTransport.transportId) {
        throw new Error('Backend transport id is missing')
      }

      return transport.backendTransport.transportId
    },
    [],
  )

  const attachRemoteTrack = useCallback(async (track: MediaStreamTrack) => {
    const remoteStream = remoteStreamRef.current ?? new MediaStream()

    remoteStreamRef.current = remoteStream
    remoteStream.addTrack(track)

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream
      await remoteAudioRef.current.play().catch(() => undefined)
    }
  }, [])

  const consumeRemoteProducer = useCallback(
    async ({
      adapter,
      recvTransportId,
      runId,
      producer,
    }: {
      adapter: SfuClientAdapter
      recvTransportId: string
      runId: number
      producer: RemoteProducerMetadata
    }) => {
      if (startRunIdRef.current !== runId) {
        return
      }

      if (producer.participantSessionId === sessionScope.participantSessionId) {
        return
      }

      if (consumedProducerIdsRef.current.has(producer.producerId)) {
        return
      }

      const producerKey = `${producer.participantSessionId}:${producer.kind}`

      if (consumedProducerKeysRef.current.has(producerKey)) {
        return
      }

      consumedProducerIdsRef.current.add(producer.producerId)
      consumedProducerKeysRef.current.add(producerKey)
      consumedProducerKeyByIdRef.current.set(producer.producerId, producerKey)

      const consumerMetadata = await adapter.createConsumerMetadata({
        transportId: recvTransportId,
        sessionScope,
        producerId: producer.producerId,
      })
      const consumed = await adapter.consume(consumerMetadata, {
        transportId: recvTransportId,
      })

      await attachRemoteTrack(consumed.track)
      await waitForRemoteTrackFlow(consumed.track)

      if (startRunIdRef.current !== runId) {
        return
      }

      setRemoteProducerIds((current) =>
        current.includes(producer.producerId) ? current : [...current, producer.producerId],
      )
      setConsumerIds((current) =>
        consumed.backendConsumer.consumerId && !current.includes(consumed.backendConsumer.consumerId)
          ? [...current, consumed.backendConsumer.consumerId]
          : current,
      )
      setStatus('connected')
      setDetail('Remote SFU producer event received and consumed')
    },
    [attachRemoteTrack, sessionScope],
  )

  const subscribeToProducerEvents = useCallback(
    ({
      adapter,
      recvTransportId,
      runId,
    }: {
      adapter: SfuClientAdapter
      recvTransportId: string
      runId: number
    }): Promise<void> => {
      const eventSource = adapter.createProducerEventSource(sessionScope)

      eventSourceRef.current = eventSource

      return new Promise<void>((resolve, reject) => {
        let initialSnapshotReceived = false

        eventSource.onerror = () => {
          if (startRunIdRef.current !== runId) {
            return
          }

          if (!initialSnapshotReceived) {
            initialSnapshotReceived = true
            reject(new Error('Media signaling event stream failed before initial snapshot'))
            return
          }

          setStatus('failed')
          setDetail('Media signaling event stream failed')
        }
        eventSource.onmessage = (message) => {
          void (async () => {
            const event = JSON.parse(message.data) as MediasoupPrototypeEvent

            if (event.type === 'producer.snapshot') {
              const remoteProducers = event.producers.filter(
                (producer) => producer.participantSessionId !== sessionScope.participantSessionId,
              )

              if (!initialSnapshotReceived) {
                initialSnapshotReceived = true
                resolve()
              }

              for (const producer of remoteProducers) {
                await consumeRemoteProducer({
                  adapter,
                  recvTransportId,
                  runId,
                  producer,
                })
              }

              if (remoteProducers.length === 0 && consumedProducerIdsRef.current.size === 0) {
                setStatus('waiting')
                setDetail('Media signaling subscribed; waiting for remote participant producer')
              }

              return
            }

            if (event.type === 'producer.published') {
              await consumeRemoteProducer({
                adapter,
                recvTransportId,
                runId,
                producer: event.producer,
              })
              return
            }

            if (event.type === 'producer.closed') {
              const producerKey = consumedProducerKeyByIdRef.current.get(event.producerId)

              consumedProducerIdsRef.current.delete(event.producerId)
              consumedProducerKeyByIdRef.current.delete(event.producerId)

              if (producerKey) {
                consumedProducerKeysRef.current.delete(producerKey)
              }

              setRemoteProducerIds((current) => current.filter((producerId) => producerId !== event.producerId))
            }
          })().catch((error: unknown) => {
            if (startRunIdRef.current !== runId) {
              return
            }

            if (!initialSnapshotReceived) {
              initialSnapshotReceived = true
              reject(error instanceof Error ? error : new Error('Unknown media signaling event failure'))
              return
            }

            setStatus('failed')
            setDetail(error instanceof Error ? error.message : 'Unknown media signaling event failure')
          })
        }
      })
    },
    [consumeRemoteProducer, sessionScope],
  )

  const startSfuPrivatePath = useCallback(async () => {
    const runId = startRunIdRef.current + 1
    startRunIdRef.current = runId
    cleanup()
    setStatus('starting')
    setDetail('Starting scoped SFU private-call path')
    setProducerId(null)
    setConsumerIds([])
    setRemoteProducerIds([])

    const adapter = new SfuClientAdapter()
    adapterRef.current = adapter

    try {
      const sendTransport = await adapter.createTransport({
        direction: 'send',
        includeTurnCredentials: true,
        iceTransportPolicy,
        sessionScope,
      })
      const sendTransportId = assertScopedTransport(sendTransport)

      const recvTransport = await adapter.createTransport({
        direction: 'recv',
        includeTurnCredentials: true,
        iceTransportPolicy,
        sessionScope,
      })
      const recvTransportId = assertScopedTransport(recvTransport)

      setStatus('waiting')
      setDetail('Opening media signaling before local SFU publish')
      await subscribeToProducerEvents({
        adapter,
        recvTransportId,
        runId,
      })

      const localTrack = await createSyntheticAudioTrack()
      const produced = await adapter.produce(localTrack, {
        transportId: sendTransportId,
        sessionScope,
        stopTracks: false,
      })
      const backendProducerId = produced.backendProducer.producerId

      if (!backendProducerId) {
        throw new Error('Backend producer id is missing')
      }

      if (startRunIdRef.current !== runId) {
        return
      }

      setProducerId(backendProducerId)

      if (consumedProducerIdsRef.current.size === 0) {
        setStatus('waiting')
        setDetail('Local SFU producer is published; waiting for remote participant producer')
      }
    } catch (error) {
      if (startRunIdRef.current !== runId) {
        return
      }

      setStatus('failed')
      setDetail(error instanceof Error ? error.message : 'Unknown SFU private-call failure')
    }
  }, [
    assertScopedTransport,
    cleanup,
    createSyntheticAudioTrack,
    iceTransportPolicy,
    sessionScope,
    subscribeToProducerEvents,
  ])

  useEffect(() => {
    void startSfuPrivatePath()
  }, [startSfuPrivatePath])

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-medium" data-testid="private-sfu-provider">
            SFU private call
          </div>
          <div className="truncate text-xs text-zinc-400">
            {controlPlaneJoin.room.roomId}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Restart SFU private call"
            onClick={() => void startSfuPrivatePath()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="destructive" aria-label="Leave call" onClick={onLeave}>
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-lg font-semibold" data-testid="private-sfu-status">
          {status}
        </div>
        <p className="max-w-xl text-sm text-zinc-400">{detail}</p>
        <dl className="grid w-full max-w-xl grid-cols-2 gap-3 text-left text-xs text-zinc-400">
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Room</dt>
            <dd className="truncate text-zinc-100">{sessionScope.roomId}</dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Session</dt>
            <dd className="truncate text-zinc-100">{sessionScope.participantSessionId}</dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Producer</dt>
            <dd className="truncate text-zinc-100">{producerId ?? '-'}</dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Consumer</dt>
            <dd className="truncate text-zinc-100">{consumerIds[0] ?? '-'}</dd>
          </div>
        </dl>
        <div className="text-xs text-zinc-500" data-testid="private-sfu-remote-producer-count">
          Remote producers: {remoteProducerIds.length}
        </div>
        <div className="text-xs text-zinc-500">
          Requested media: audio {audio ? 'on' : 'off'}, video {video ? 'on' : 'off'}
        </div>
        <audio ref={remoteAudioRef} controls className="h-10 w-full max-w-xl" />
      </div>
    </div>
  )
}
