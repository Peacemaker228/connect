'use client'

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, MicOff, PhoneOff, RotateCcw, ScreenShare, ScreenShareOff, Video, VideoOff } from 'lucide-react'
import type { JoinRoomResponse } from '@sdk/actions/media'

import { Button } from '@/lib/shared/ui/button'

import {
  SfuClientAdapter,
  type MediasoupPrototypeEvent,
  type SfuClientSessionScope,
  type SfuClientTransportBundle,
} from './sfu-client-adapter'

type SfuPrivateCallStatus = 'idle' | 'starting' | 'waiting' | 'connected' | 'reconnecting' | 'failed'

type RemoteProducerMetadata = Extract<MediasoupPrototypeEvent, { type: 'producer.published' }>['producer']

type SfuPrivateCallAdapterProps = {
  controlPlaneJoin: JoinRoomResponse
  audio: boolean
  video: boolean
  iceTransportPolicy?: RTCIceTransportPolicy
  captureMode?: 'synthetic' | 'real'
  simulateMissingCamera?: boolean
  roomLabel?: string
  restartAriaLabel?: string
  remoteVideoLayout?: 'single' | 'participant-grid'
  onLeave: () => void
}

const MISSING_CAMERA_NOTICE = 'Camera not found; continuing audio-only'

type RemoteParticipantMedia = {
  participantSessionId: string
  audioProducerId?: string
  videoProducerId?: string
  videoTrack?: MediaStreamTrack
}

type RemoteScreenShareMedia = {
  participantSessionId: string
  producerId: string
  track: MediaStreamTrack
}

type SpeakingDetectorHandle = {
  close: () => void
}

type LocalCaptureResult = {
  tracks: MediaStreamTrack[]
  audioContext?: AudioContext
  oscillator?: OscillatorNode
  videoTrack?: MediaStreamTrack
  continuedAudioOnly?: boolean
}

type RemoteTrackCounts = {
  audio: number
  camera: number
  screen: number
}

const EMPTY_REMOTE_TRACK_COUNTS: RemoteTrackCounts = {
  audio: 0,
  camera: 0,
  screen: 0,
}

const getMediaErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Unknown media capture failure'
}

const isMissingVideoCaptureError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false
  }

  const name = error.name.toLowerCase()
  const message = error.message.toLowerCase()

  return (
    name === 'notfounderror' ||
    name === 'devicesnotfounderror' ||
    name === 'overconstrainederror' ||
    message.includes('not found') ||
    message.includes('requested device not found') ||
    message.includes('no camera') ||
    message.includes('no video')
  )
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

const createSpeakingDetector = (
  stream: MediaStream,
  onSpeakingChange: (speaking: boolean) => void,
): SpeakingDetectorHandle | null => {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext

  if (!AudioContextConstructor || stream.getAudioTracks().length === 0) {
    onSpeakingChange(false)
    return null
  }

  const audioContext = new AudioContextConstructor()
  const analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaStreamSource(stream)
  const samples = new Uint8Array(analyser.fftSize)
  let animationFrameId: number | null = null
  let lastSpeaking = false
  let closed = false

  analyser.fftSize = 512
  source.connect(analyser)

  const tick = () => {
    if (closed) {
      return
    }

    analyser.getByteTimeDomainData(samples)

    let total = 0

    for (const sample of samples) {
      total += Math.abs(sample - 128)
    }

    const speaking = total / samples.length > 5

    if (speaking !== lastSpeaking) {
      lastSpeaking = speaking
      onSpeakingChange(speaking)
    }

    animationFrameId = window.requestAnimationFrame(tick)
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => undefined)
  }

  tick()

  return {
    close: () => {
      closed = true

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      source.disconnect()
      void audioContext.close().catch(() => undefined)
      onSpeakingChange(false)
    },
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export const SfuPrivateCallAdapter: FC<SfuPrivateCallAdapterProps> = ({
  controlPlaneJoin,
  audio,
  video,
  iceTransportPolicy,
  captureMode = 'synthetic',
  simulateMissingCamera = false,
  roomLabel = 'SFU private call',
  restartAriaLabel = 'Restart SFU private call',
  remoteVideoLayout = 'single',
  onLeave,
}) => {
  const adapterRef = useRef<SfuClientAdapter | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const localTracksRef = useRef<MediaStreamTrack[]>([])
  const screenShareTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenShareProducerIdRef = useRef<string | null>(null)
  const sendTransportIdRef = useRef<string | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioTrackByProducerIdRef = useRef(new Map<string, MediaStreamTrack>())
  const eventSourceRef = useRef<EventSource | null>(null)
  const heartbeatTimerRef = useRef<number | null>(null)
  const producerStateSyncTimerRef = useRef<number | null>(null)
  const localSpeakingDetectorRef = useRef<SpeakingDetectorHandle | null>(null)
  const remoteSpeakingDetectorRef = useRef<SpeakingDetectorHandle | null>(null)
  const consumedProducerIdsRef = useRef(new Set<string>())
  const consumedProducerKeysRef = useRef(new Set<string>())
  const consumedProducerKeyByIdRef = useRef(new Map<string, string>())
  const consumedProducerByIdRef = useRef(new Map<string, RemoteProducerMetadata>())
  const startRunIdRef = useRef(0)
  const [status, setStatus] = useState<SfuPrivateCallStatus>('idle')
  const [detail, setDetail] = useState('Waiting for scoped SFU gate')
  const [producerIds, setProducerIds] = useState<string[]>([])
  const [consumerIds, setConsumerIds] = useState<string[]>([])
  const [remoteProducerIds, setRemoteProducerIds] = useState<string[]>([])
  const [remoteTrackCounts, setRemoteTrackCounts] = useState<RemoteTrackCounts>(EMPTY_REMOTE_TRACK_COUNTS)
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantMedia[]>([])
  const [remoteScreenShares, setRemoteScreenShares] = useState<RemoteScreenShareMedia[]>([])
  const [hasSingleRemoteVideoTrack, setHasSingleRemoteVideoTrack] = useState(false)
  const [localScreenShareTrack, setLocalScreenShareTrack] = useState<MediaStreamTrack | null>(null)
  const [localScreenShareProducerId, setLocalScreenShareProducerId] = useState<string | null>(null)
  const [localAudioEnabled, setLocalAudioEnabled] = useState(audio)
  const [localVideoEnabled, setLocalVideoEnabled] = useState(video)
  const [captureNotice, setCaptureNotice] = useState<string | null>(null)
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false)
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false)
  const desiredLocalAudioEnabledRef = useRef(audio)
  const desiredLocalVideoEnabledRef = useRef(video)

  const sessionScope: SfuClientSessionScope = useMemo(
    () => ({
      roomId: controlPlaneJoin.participantSession.roomId,
      participantSessionId: controlPlaneJoin.participantSession.participantSessionId,
    }),
    [controlPlaneJoin.participantSession.participantSessionId, controlPlaneJoin.participantSession.roomId],
  )

  const cleanup = useCallback((options: { closeAdapter?: boolean } = {}) => {
    if (heartbeatTimerRef.current !== null) {
      window.clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }

    if (producerStateSyncTimerRef.current !== null) {
      window.clearInterval(producerStateSyncTimerRef.current)
      producerStateSyncTimerRef.current = null
    }

    eventSourceRef.current?.close()
    eventSourceRef.current = null

    if (options.closeAdapter !== false) {
      void adapterRef.current?.close()
    }
    adapterRef.current = null
    sendTransportIdRef.current = null
    remoteAudioTrackByProducerIdRef.current.clear()
    consumedProducerIdsRef.current.clear()
    consumedProducerKeysRef.current.clear()
    consumedProducerKeyByIdRef.current.clear()
    consumedProducerByIdRef.current.clear()
    setRemoteTrackCounts(EMPTY_REMOTE_TRACK_COUNTS)
    remoteStreamRef.current = null
    remoteVideoStreamRef.current = null

    for (const track of localTracksRef.current) {
      track.stop()
    }

    localTracksRef.current = []
    screenShareTrackRef.current?.stop()
    screenShareTrackRef.current = null
    screenShareProducerIdRef.current = null
    setLocalScreenShareTrack(null)
    setLocalScreenShareProducerId(null)
    setRemoteScreenShares((current) => {
      for (const screenShare of current) {
        screenShare.track.stop()
      }

      return []
    })
    localSpeakingDetectorRef.current?.close()
    localSpeakingDetectorRef.current = null
    remoteSpeakingDetectorRef.current?.close()
    remoteSpeakingDetectorRef.current = null
    setIsLocalSpeaking(false)
    setIsRemoteSpeaking(false)

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

    if (localVideoRef.current) {
      localVideoRef.current.pause()
      localVideoRef.current.srcObject = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause()
      remoteVideoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    return () => {
      startRunIdRef.current += 1
      cleanup()
    }
  }, [cleanup])

  const setLocalSpeakingState = useCallback((speaking: boolean) => {
    setIsLocalSpeaking((current) => (current === speaking ? current : speaking))
  }, [])

  const setRemoteSpeakingState = useCallback((speaking: boolean) => {
    setIsRemoteSpeaking((current) => (current === speaking ? current : speaking))
  }, [])

  const startLocalSpeakingDetector = useCallback(
    (tracks: MediaStreamTrack[]) => {
      localSpeakingDetectorRef.current?.close()
      localSpeakingDetectorRef.current = null

      const audioTrack = tracks.find((track) => track.kind === 'audio')

      if (!audioTrack) {
        setLocalSpeakingState(false)
        return
      }

      localSpeakingDetectorRef.current = createSpeakingDetector(new MediaStream([audioTrack]), setLocalSpeakingState)
    },
    [setLocalSpeakingState],
  )

  const startRemoteSpeakingDetector = useCallback(
    (stream: MediaStream | null) => {
      remoteSpeakingDetectorRef.current?.close()
      remoteSpeakingDetectorRef.current = null

      const audioTracks = stream?.getAudioTracks().filter((track) => track.enabled && track.readyState === 'live') ?? []

      if (audioTracks.length === 0) {
        setRemoteSpeakingState(false)
        return
      }

      remoteSpeakingDetectorRef.current = createSpeakingDetector(new MediaStream(audioTracks), setRemoteSpeakingState)
    },
    [setRemoteSpeakingState],
  )

  const applyLocalTrackEnabled = useCallback(
    async (kind: MediaStreamTrack['kind'], enabled: boolean, source?: 'microphone' | 'camera' | 'screen') => {
      for (const track of localTracksRef.current.filter((item) => item.kind === kind)) {
        track.enabled = enabled
      }

      try {
        await adapterRef.current?.setProducerTrackEnabled(kind, enabled, source)
      } catch (error) {
        console.warn('[media] failed to update SFU producer enabled state', error)
      }

      if (kind === 'audio' && !enabled) {
        setIsLocalSpeaking(false)
      }
    },
    [],
  )

  const applyRemoteProducerPausedState = useCallback(
    (producerId: string, paused: boolean) => {
      const producer = consumedProducerByIdRef.current.get(producerId)

      if (!producer) {
        return
      }

      if (producer.kind === 'audio') {
        const remoteTrack = remoteAudioTrackByProducerIdRef.current.get(producerId)

        if (remoteTrack) {
          remoteTrack.enabled = !paused
        }

        startRemoteSpeakingDetector(remoteStreamRef.current)
      }

      if (producer.kind === 'video' && remoteVideoLayout === 'participant-grid') {
        if (producer.source === 'screen') {
          setRemoteScreenShares((current) =>
            current.map((screenShare) => {
              if (screenShare.producerId !== producerId) {
                return screenShare
              }

              screenShare.track.enabled = !paused

              return {
                ...screenShare,
                track: screenShare.track,
              }
            }),
          )
          return
        }

        setRemoteParticipants((current) =>
          current.map((participant) => {
            const videoTrack = participant.videoTrack

            if (participant.videoProducerId !== producerId || !videoTrack) {
              return participant
            }

            videoTrack.enabled = !paused

            return {
              ...participant,
              videoTrack,
            }
          }),
        )
      }
    },
    [remoteVideoLayout, startRemoteSpeakingDetector],
  )

  const syncRemoteTrackCounts = useCallback(() => {
    const counts: RemoteTrackCounts = {
      audio: 0,
      camera: 0,
      screen: 0,
    }

    for (const producer of consumedProducerByIdRef.current.values()) {
      if (producer.kind === 'audio') {
        counts.audio += 1
        continue
      }

      if (producer.source === 'screen') {
        counts.screen += 1
        continue
      }

      counts.camera += 1
    }

    setRemoteTrackCounts(counts)
  }, [])

  const createSyntheticAudioCapture = useCallback(async (): Promise<LocalCaptureResult> => {
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

    return {
      tracks: [track],
      audioContext,
      oscillator,
    }
  }, [])

  const createRealDeviceCapture = useCallback(async (): Promise<LocalCaptureResult> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser media device capture is not available')
    }

    const audioConstraints = audio
      ? {
          echoCancellation: true,
          noiseSuppression: true,
        }
      : false
    let stream: MediaStream
    let continuedAudioOnly = false

    try {
      if (simulateMissingCamera && video) {
        throw new DOMException('Requested device not found', 'NotFoundError')
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video,
      })
    } catch (error) {
      if (!video || !audio || !isMissingVideoCaptureError(error)) {
        throw new Error(`Local media capture failed: ${getMediaErrorMessage(error)}`)
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false,
        })
        continuedAudioOnly = true
      } catch (audioOnlyError) {
        throw new Error(`Camera was not found and audio-only fallback failed: ${getMediaErrorMessage(audioOnlyError)}`)
      }
    }

    const tracks = stream.getTracks()
    const videoTrack = stream.getVideoTracks()[0]

    if (tracks.length === 0) {
      throw new Error('No local media tracks were captured')
    }

    return {
      tracks,
      videoTrack,
      continuedAudioOnly,
    }
  }, [audio, simulateMissingCamera, video])

  const createLocalCapture = useCallback(async () => {
    if (captureMode === 'real') {
      return createRealDeviceCapture()
    }

    return createSyntheticAudioCapture()
  }, [captureMode, createRealDeviceCapture, createSyntheticAudioCapture])

  const cleanupLocalCapture = useCallback((capture: LocalCaptureResult | null) => {
    if (!capture) {
      return
    }

    for (const track of capture.tracks) {
      track.stop()
    }

    try {
      capture.oscillator?.stop()
    } catch {
      // OscillatorNode throws if it has already stopped.
    }

    void capture.audioContext?.close()
  }, [])

  const assertScopedTransport = useCallback((transport: SfuClientTransportBundle) => {
    if (!transport.backendTransport.transportId) {
      throw new Error('Backend transport id is missing')
    }

    return transport.backendTransport.transportId
  }, [])

  const startSessionHeartbeat = useCallback(
    (adapter: SfuClientAdapter) => {
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current)
      }

      void adapter.heartbeatSession(sessionScope).catch(() => undefined)
      heartbeatTimerRef.current = window.setInterval(() => {
        void adapterRef.current?.heartbeatSession(sessionScope).catch(() => undefined)
      }, 5000)
    },
    [sessionScope],
  )

  const startProducerStateSync = useCallback(
    (adapter: SfuClientAdapter, runId: number) => {
      if (producerStateSyncTimerRef.current !== null) {
        window.clearInterval(producerStateSyncTimerRef.current)
      }

      producerStateSyncTimerRef.current = window.setInterval(() => {
        if (startRunIdRef.current !== runId) {
          return
        }

        void adapter
          .discoverProducers(sessionScope)
          .then((discovery) => {
            if (startRunIdRef.current !== runId || !discovery.enabled || discovery.status !== 'ready') {
              return
            }

            for (const producer of discovery.producers) {
              if (producer.participantSessionId === sessionScope.participantSessionId) {
                continue
              }

              applyRemoteProducerPausedState(producer.producerId, producer.paused)
            }
          })
          .catch(() => undefined)
      }, 1000)
    },
    [applyRemoteProducerPausedState, sessionScope],
  )

  const attachRemoteTrack = useCallback(
    async (track: MediaStreamTrack, producer: RemoteProducerMetadata) => {
      if (track.kind === 'video' && producer.source === 'screen') {
        setRemoteScreenShares((current) => {
          for (const screenShare of current) {
            if (screenShare.producerId !== producer.producerId) {
              screenShare.track.stop()
            }
          }

          return [
            {
              participantSessionId: producer.participantSessionId,
              producerId: producer.producerId,
              track,
            },
          ]
        })
        return
      }

      if (remoteVideoLayout === 'participant-grid') {
        setRemoteParticipants((current) =>
          upsertRemoteParticipant({
            current,
            participantSessionId: producer.participantSessionId,
            audioProducerId: track.kind === 'audio' ? producer.producerId : undefined,
            videoProducerId: track.kind === 'video' ? producer.producerId : undefined,
            videoTrack: track.kind === 'video' ? track : undefined,
          }),
        )
      }

      if (track.kind === 'video') {
        if (remoteVideoLayout === 'participant-grid') {
          return
        }

        const remoteVideoStream = remoteVideoStreamRef.current ?? new MediaStream()

        remoteVideoStreamRef.current = remoteVideoStream
        remoteVideoStream.addTrack(track)
        setHasSingleRemoteVideoTrack(true)

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteVideoStream
          await remoteVideoRef.current.play().catch(() => undefined)
        }

        return
      }

      const remoteStream = remoteStreamRef.current ?? new MediaStream()

      remoteStreamRef.current = remoteStream
      remoteStream.addTrack(track)
      remoteAudioTrackByProducerIdRef.current.set(producer.producerId, track)
      startRemoteSpeakingDetector(remoteStream)

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream
        await remoteAudioRef.current.play().catch(() => undefined)
      }
    },
    [remoteVideoLayout, startRemoteSpeakingDetector],
  )

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

      const producerKey = `${producer.participantSessionId}:${producer.kind}:${producer.source ?? 'unknown'}`

      if (consumedProducerKeysRef.current.has(producerKey)) {
        return
      }

      consumedProducerIdsRef.current.add(producer.producerId)
      consumedProducerKeysRef.current.add(producerKey)
      consumedProducerKeyByIdRef.current.set(producer.producerId, producerKey)
      consumedProducerByIdRef.current.set(producer.producerId, producer)

      const consumerMetadata = await adapter.createConsumerMetadata({
        transportId: recvTransportId,
        sessionScope,
        producerId: producer.producerId,
      })
      const consumed = await adapter.consume(consumerMetadata, {
        transportId: recvTransportId,
      })

      await attachRemoteTrack(consumed.track, producer)
      applyRemoteProducerPausedState(producer.producerId, producer.paused)
      await waitForRemoteTrackFlow(consumed.track)

      if (startRunIdRef.current !== runId) {
        return
      }

      setRemoteProducerIds((current) =>
        current.includes(producer.producerId) ? current : [...current, producer.producerId],
      )
      syncRemoteTrackCounts()
      setConsumerIds((current) =>
        consumed.backendConsumer.consumerId && !current.includes(consumed.backendConsumer.consumerId)
          ? [...current, consumed.backendConsumer.consumerId]
          : current,
      )
      setStatus('connected')
      setDetail('Remote SFU producer event received and consumed')
    },
    [applyRemoteProducerPausedState, attachRemoteTrack, sessionScope, syncRemoteTrackCounts],
  )

  const removeRemoteProducer = useCallback(
    (producerId: string) => {
      const producerKey = consumedProducerKeyByIdRef.current.get(producerId)

      consumedProducerIdsRef.current.delete(producerId)
      consumedProducerKeyByIdRef.current.delete(producerId)

      if (producerKey) {
        consumedProducerKeysRef.current.delete(producerKey)
      }

      const producer = consumedProducerByIdRef.current.get(producerId)
      consumedProducerByIdRef.current.delete(producerId)

      if (producer?.kind === 'audio') {
        const remoteTrack = remoteAudioTrackByProducerIdRef.current.get(producerId)

        remoteAudioTrackByProducerIdRef.current.delete(producerId)

        if (remoteTrack && remoteStreamRef.current) {
          remoteStreamRef.current.removeTrack(remoteTrack)
          remoteTrack.stop()

          if (remoteStreamRef.current.getAudioTracks().length === 0) {
            remoteAudioRef.current?.pause()

            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null
            }

            remoteStreamRef.current = null
            startRemoteSpeakingDetector(null)
          } else {
            startRemoteSpeakingDetector(remoteStreamRef.current)
          }
        }
      }

      if (producer?.kind === 'video' && producer.source === 'screen') {
        setRemoteScreenShares((current) => {
          const screenShare = current.find((item) => item.producerId === producerId)

          screenShare?.track.stop()

          return current.filter((item) => item.producerId !== producerId)
        })
      }

      if (producer?.kind === 'video' && producer.source !== 'screen' && remoteVideoLayout === 'single') {
        setHasSingleRemoteVideoTrack(false)
      }

      if (producer && producer.source !== 'screen' && remoteVideoLayout === 'participant-grid') {
        setRemoteParticipants((current) =>
          removeRemoteParticipantProducer({
            current,
            participantSessionId: producer.participantSessionId,
            kind: producer.kind,
            source: producer.source,
            producerId,
          }),
        )
      }

      setRemoteProducerIds((current) => current.filter((item) => item !== producerId))
      syncRemoteTrackCounts()
    },
    [remoteVideoLayout, startRemoteSpeakingDetector, syncRemoteTrackCounts],
  )

  const clearLocalScreenShare = useCallback((producerId?: string) => {
    const currentProducerId = screenShareProducerIdRef.current

    if (!currentProducerId || (producerId && currentProducerId !== producerId)) {
      return
    }

    const track = screenShareTrackRef.current

    screenShareProducerIdRef.current = null
    screenShareTrackRef.current = null
    setLocalScreenShareProducerId(null)
    setLocalScreenShareTrack(null)
    setProducerIds((current) => current.filter((item) => item !== currentProducerId))
    adapterRef.current?.closeLocalProducer(currentProducerId)

    if (track && track.readyState === 'live') {
      track.stop()
    }
  }, [])

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

          setStatus('reconnecting')
          setDetail('Media signaling event stream interrupted; waiting for browser reconnect or manual restart')
        }
        eventSource.onmessage = (message) => {
          void (async () => {
            const event = JSON.parse(message.data) as MediasoupPrototypeEvent

            if (event.type === 'producer.snapshot') {
              const allSnapshotProducerIds = new Set(event.producers.map((producer) => producer.producerId))
              const remoteProducers = event.producers.filter(
                (producer) => producer.participantSessionId !== sessionScope.participantSessionId,
              )
              const snapshotProducerIds = new Set(remoteProducers.map((producer) => producer.producerId))
              const localScreenShareProducerId = screenShareProducerIdRef.current

              if (localScreenShareProducerId && !allSnapshotProducerIds.has(localScreenShareProducerId)) {
                clearLocalScreenShare(localScreenShareProducerId)
              }

              for (const producerId of [...consumedProducerIdsRef.current]) {
                if (!snapshotProducerIds.has(producerId)) {
                  removeRemoteProducer(producerId)
                }
              }

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
                return
              }

              if (remoteProducers.length > 0 && consumedProducerIdsRef.current.size > 0) {
                setStatus('connected')
                setDetail('Media signaling snapshot received; remote producer is consumed')
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
              clearLocalScreenShare(event.producerId)
              removeRemoteProducer(event.producerId)
            }

            if (event.type === 'producer.paused' || event.type === 'producer.resumed') {
              applyRemoteProducerPausedState(event.producerId, event.type === 'producer.paused')
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
    [applyRemoteProducerPausedState, clearLocalScreenShare, consumeRemoteProducer, removeRemoteProducer, sessionScope],
  )

  const startSfuPath = useCallback(async () => {
    const runId = startRunIdRef.current + 1
    startRunIdRef.current = runId
    const previousAdapter = adapterRef.current
    cleanup({ closeAdapter: false })
    await previousAdapter?.close()
    setStatus('starting')
    setDetail('Starting scoped SFU media path')
    setProducerIds([])
    setConsumerIds([])
    setRemoteProducerIds([])
    setRemoteTrackCounts(EMPTY_REMOTE_TRACK_COUNTS)
    setRemoteParticipants([])
    setRemoteScreenShares([])
    setHasSingleRemoteVideoTrack(false)
    desiredLocalAudioEnabledRef.current = audio
    desiredLocalVideoEnabledRef.current = video
    setLocalAudioEnabled(audio)
    setLocalVideoEnabled(video)
    setCaptureNotice(null)

    const adapter = new SfuClientAdapter()
    adapterRef.current = adapter
    startSessionHeartbeat(adapter)
    let localCapture: LocalCaptureResult | null = null

    const isStaleRun = () => startRunIdRef.current !== runId
    const cleanupStaleRun = () => {
      void adapter.close()
      cleanupLocalCapture(localCapture)
    }

    try {
      const sendTransport = await adapter.createTransport({
        direction: 'send',
        includeTurnCredentials: true,
        iceTransportPolicy,
        sessionScope,
      })
      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      const sendTransportId = assertScopedTransport(sendTransport)
      sendTransportIdRef.current = sendTransportId

      const recvTransport = await adapter.createTransport({
        direction: 'recv',
        includeTurnCredentials: true,
        iceTransportPolicy,
        sessionScope,
      })
      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      const recvTransportId = assertScopedTransport(recvTransport)

      setStatus('waiting')
      setDetail('Opening media signaling before local SFU publish')
      await subscribeToProducerEvents({
        adapter,
        recvTransportId,
        runId,
      })
      startProducerStateSync(adapter, runId)
      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      localCapture = await createLocalCapture()
      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      if (localCapture.continuedAudioOnly) {
        setCaptureNotice(MISSING_CAMERA_NOTICE)
        setDetail(MISSING_CAMERA_NOTICE)
      }

      audioContextRef.current = localCapture.audioContext ?? null
      oscillatorRef.current = localCapture.oscillator ?? null
      localTracksRef.current = localCapture.tracks
      setLocalAudioEnabled(localCapture.tracks.some((track) => track.kind === 'audio' && track.enabled))
      setLocalVideoEnabled(localCapture.tracks.some((track) => track.kind === 'video' && track.enabled))

      if (localVideoRef.current && localCapture.videoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localCapture.videoTrack])
        await localVideoRef.current.play().catch(() => undefined)
      }

      const localTracks = localCapture.tracks
      await applyLocalTrackEnabled('audio', desiredLocalAudioEnabledRef.current, 'microphone')
      await applyLocalTrackEnabled('video', desiredLocalVideoEnabledRef.current, 'camera')
      startLocalSpeakingDetector(localTracks)
      const produced = await Promise.all(
        localTracks.map((track) =>
          adapter.produce(track, {
            transportId: sendTransportId,
            sessionScope,
            source: track.kind === 'audio' ? 'microphone' : 'camera',
            stopTracks: false,
          }),
        ),
      )
      const backendProducerIds = produced
        .map((item) => item.backendProducer.producerId)
        .filter((producerId): producerId is string => Boolean(producerId))

      if (backendProducerIds.length !== localTracks.length) {
        throw new Error('Backend producer metadata is missing')
      }

      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      await applyLocalTrackEnabled('audio', desiredLocalAudioEnabledRef.current, 'microphone')
      await applyLocalTrackEnabled('video', desiredLocalVideoEnabledRef.current, 'camera')
      setProducerIds(backendProducerIds)

      if (consumedProducerIdsRef.current.size === 0) {
        setStatus('waiting')
        setDetail('Local SFU producer is published; waiting for remote participant producer')
      }
    } catch (error) {
      if (isStaleRun()) {
        cleanupStaleRun()
        return
      }

      setStatus('failed')
      setDetail(error instanceof Error ? error.message : 'Unknown SFU media failure')
    }
  }, [
    assertScopedTransport,
    audio,
    applyLocalTrackEnabled,
    cleanup,
    cleanupLocalCapture,
    createLocalCapture,
    iceTransportPolicy,
    sessionScope,
    startSessionHeartbeat,
    startProducerStateSync,
    startLocalSpeakingDetector,
    subscribeToProducerEvents,
    video,
  ])

  useEffect(() => {
    void startSfuPath()
  }, [startSfuPath])

  const toggleLocalAudio = useCallback(() => {
    const nextEnabled = !localAudioEnabled

    desiredLocalAudioEnabledRef.current = nextEnabled
    void applyLocalTrackEnabled('audio', nextEnabled, 'microphone')

    if (nextEnabled) {
      startLocalSpeakingDetector(localTracksRef.current)
    }

    setLocalAudioEnabled(nextEnabled)
  }, [applyLocalTrackEnabled, localAudioEnabled, startLocalSpeakingDetector])

  const toggleLocalVideo = useCallback(() => {
    const nextEnabled = !localVideoEnabled

    desiredLocalVideoEnabledRef.current = nextEnabled
    void applyLocalTrackEnabled('video', nextEnabled, 'camera')
    setLocalVideoEnabled(nextEnabled)
  }, [applyLocalTrackEnabled, localVideoEnabled])

  const stopScreenShare = useCallback(async () => {
    const producerId = screenShareProducerIdRef.current
    const track = screenShareTrackRef.current

    screenShareProducerIdRef.current = null
    screenShareTrackRef.current = null
    setLocalScreenShareProducerId(null)
    setLocalScreenShareTrack(null)
    if (producerId) {
      setProducerIds((current) => current.filter((item) => item !== producerId))
    }

    if (track && track.readyState === 'live') {
      track.stop()
    }

    if (producerId) {
      await adapterRef.current?.closeProducer(producerId, sessionScope).catch((error: unknown) => {
        console.warn('[media] failed to close SFU screen-share producer', error)
      })
    }
  }, [sessionScope])

  const startScreenShare = useCallback(async () => {
    if (screenShareProducerIdRef.current) {
      await stopScreenShare()
    }

    const adapter = adapterRef.current
    const sendTransportId = sendTransportIdRef.current

    if (!adapter || !sendTransportId || !navigator.mediaDevices?.getDisplayMedia) {
      setDetail('Screen share is not available in this browser/session')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
      })
      const screenTrack = stream.getVideoTracks()[0]

      if (!screenTrack) {
        throw new Error('Screen share did not create a video track')
      }

      screenShareTrackRef.current = screenTrack
      setLocalScreenShareTrack(screenTrack)

      const produced = await adapter.produce(screenTrack, {
        transportId: sendTransportId,
        sessionScope,
        source: 'screen',
        stopTracks: false,
      })
      const producerId = produced.backendProducer.producerId

      if (!producerId) {
        throw new Error('Backend screen-share producer metadata is missing')
      }

      screenShareProducerIdRef.current = producerId
      setLocalScreenShareProducerId(producerId)
      setProducerIds((current) => (current.includes(producerId) ? current : [...current, producerId]))
      setDetail('Local SFU screen share is published')

      screenTrack.addEventListener('ended', () => {
        void stopScreenShare()
      })
    } catch (error) {
      await stopScreenShare()
      setDetail(error instanceof Error ? `Screen share failed: ${error.message}` : 'Screen share failed')
    }
  }, [sessionScope, stopScreenShare])

  const hasLocalAudioTrack = localTracksRef.current.some((track) => track.kind === 'audio')
  const hasLocalVideoTrack = localTracksRef.current.some((track) => track.kind === 'video')
  const isScreenSharing = Boolean(localScreenShareProducerId)
  const transportMode = iceTransportPolicy === 'relay' ? 'turn' : 'direct'
  const handleLeaveClick = useCallback(() => {
    startRunIdRef.current += 1
    cleanup()
    onLeave()
  }, [cleanup, onLeave])

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-medium" data-testid="private-sfu-provider">
            {roomLabel}
          </div>
          <div className="truncate text-xs text-zinc-400">{controlPlaneJoin.room.roomId}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={localAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            disabled={!hasLocalAudioTrack}
            data-testid="private-sfu-audio-toggle"
            onClick={toggleLocalAudio}>
            {localAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={localVideoEnabled ? 'Stop camera' : 'Start camera'}
            disabled={!hasLocalVideoTrack}
            data-testid="private-sfu-video-toggle"
            onClick={toggleLocalVideo}>
            {localVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={isScreenSharing ? 'Stop screen share' : 'Start screen share'}
            disabled={!video || status === 'starting' || status === 'failed'}
            data-testid="private-sfu-screen-share-toggle"
            onClick={() => void (isScreenSharing ? stopScreenShare() : startScreenShare())}>
            {isScreenSharing ? <ScreenShareOff className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={restartAriaLabel}
            onClick={() => void startSfuPath()}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="destructive" aria-label="Leave call" onClick={handleLeaveClick}>
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
            <dd className="truncate text-zinc-100" data-testid="private-sfu-room-id">
              {sessionScope.roomId}
            </dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Session</dt>
            <dd className="truncate text-zinc-100" data-testid="private-sfu-session-id">
              {sessionScope.participantSessionId}
            </dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Producer</dt>
            <dd className="truncate text-zinc-100" data-testid="private-sfu-producer-id">
              {producerIds[0] ?? '-'}
            </dd>
          </div>
          <div className="border border-zinc-800 p-3">
            <dt className="mb-1 text-zinc-500">Consumer</dt>
            <dd className="truncate text-zinc-100" data-testid="private-sfu-consumer-id">
              {consumerIds[0] ?? '-'}
            </dd>
          </div>
        </dl>
        <div className="text-xs text-zinc-500" data-testid="private-sfu-remote-producer-count">
          Remote tracks: {remoteProducerIds.length}
        </div>
        <div className="text-xs text-zinc-500" data-testid="private-sfu-remote-track-breakdown">
          audio {remoteTrackCounts.audio}, camera {remoteTrackCounts.camera}, screen {remoteTrackCounts.screen}
        </div>
        <div className="text-xs text-zinc-500" data-testid="private-sfu-capture-mode">
          Capture mode: {captureMode}
        </div>
        <div className="text-xs text-zinc-500" data-testid="private-sfu-transport-mode">
          Transport: {transportMode}
        </div>
        {captureNotice ? (
          <div className="text-xs text-amber-300" data-testid="private-sfu-capture-notice">
            {captureNotice}
          </div>
        ) : null}
        <div className="text-xs text-zinc-500">
          Requested media: audio {audio ? 'on' : 'off'}, video {video ? 'on' : 'off'}
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span
            className={isLocalSpeaking ? 'text-emerald-300' : 'text-zinc-500'}
            data-testid="private-sfu-local-speaking">
            Local voice: {isLocalSpeaking ? 'speaking' : 'silent'}
          </span>
          <span
            className={isRemoteSpeaking ? 'text-emerald-300' : 'text-zinc-500'}
            data-testid="private-sfu-remote-speaking">
            Remote voice: {isRemoteSpeaking ? 'speaking' : 'silent'}
          </span>
        </div>
        {localScreenShareTrack || remoteScreenShares.length > 0 ? (
          <div className="grid w-full max-w-4xl grid-cols-1 gap-3">
            {localScreenShareTrack ? (
              <ScreenShareVideoTile
                label="You are sharing your screen"
                testId="private-sfu-local-screen-share"
                videoTestId="private-sfu-local-screen-video"
                track={localScreenShareTrack}
              />
            ) : null}
            {remoteScreenShares.map((screenShare) => (
              <ScreenShareVideoTile
                key={screenShare.producerId}
                label="Remote screen share"
                testId="private-sfu-remote-screen-share"
                videoTestId="private-sfu-remote-screen-video"
                track={screenShare.track}
              />
            ))}
          </div>
        ) : null}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
          <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            className="hidden aspect-video w-full bg-black object-cover data-[active=true]:block"
            data-active={hasLocalVideoTrack}
            data-testid="private-sfu-local-video"
          />
          {remoteVideoLayout === 'participant-grid' ? (
            remoteParticipants.map((participant) => (
              <RemoteVideoTile key={participant.participantSessionId} participant={participant} />
            ))
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="hidden aspect-video w-full bg-black object-cover data-[active=true]:block"
              data-active={hasSingleRemoteVideoTrack}
              data-testid="private-sfu-remote-video"
            />
          )}
        </div>
        <audio ref={remoteAudioRef} autoPlay controls className="h-10 w-full max-w-xl" />
      </div>
    </div>
  )
}

const upsertRemoteParticipant = ({
  current,
  participantSessionId,
  audioProducerId,
  videoProducerId,
  videoTrack,
}: {
  current: RemoteParticipantMedia[]
  participantSessionId: string
  audioProducerId?: string
  videoProducerId?: string
  videoTrack?: MediaStreamTrack
}) => {
  const existing = current.find((participant) => participant.participantSessionId === participantSessionId)
  const nextParticipant: RemoteParticipantMedia = {
    participantSessionId,
    audioProducerId: audioProducerId ?? existing?.audioProducerId,
    videoProducerId: videoProducerId ?? existing?.videoProducerId,
    videoTrack: videoTrack ?? existing?.videoTrack,
  }
  const next = existing
    ? current.map((participant) =>
        participant.participantSessionId === participantSessionId ? nextParticipant : participant,
      )
    : [...current, nextParticipant]

  return next.sort((left, right) => left.participantSessionId.localeCompare(right.participantSessionId))
}

const removeRemoteParticipantProducer = ({
  current,
  participantSessionId,
  kind,
  source,
  producerId,
}: {
  current: RemoteParticipantMedia[]
  participantSessionId: string
  kind: RemoteProducerMetadata['kind']
  source?: RemoteProducerMetadata['source']
  producerId: string
}) => {
  return current
    .map((participant) => {
      if (participant.participantSessionId !== participantSessionId) {
        return participant
      }

      return {
        ...participant,
        audioProducerId:
          kind === 'audio' && participant.audioProducerId === producerId ? undefined : participant.audioProducerId,
        videoProducerId:
          kind === 'video' && source !== 'screen' && participant.videoProducerId === producerId
            ? undefined
            : participant.videoProducerId,
        videoTrack:
          kind === 'video' && source !== 'screen' && participant.videoProducerId === producerId
            ? undefined
            : participant.videoTrack,
      }
    })
    .filter((participant) => participant.audioProducerId || participant.videoProducerId)
}

const ScreenShareVideoTile: FC<{
  label: string
  testId: string
  videoTestId: string
  track: MediaStreamTrack
}> = ({ label, testId, videoTestId, track }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) {
      return
    }

    videoElement.srcObject = new MediaStream([track])
    void videoElement.play().catch(() => undefined)

    return () => {
      videoElement.pause()
      videoElement.srcObject = null
    }
  }, [track])

  return (
    <section className="w-full border border-zinc-800 bg-black" data-testid={testId}>
      <div className="border-b border-zinc-800 px-3 py-2 text-left text-xs text-zinc-400">{label}</div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="aspect-video w-full object-contain"
        data-testid={videoTestId}
      />
    </section>
  )
}

const RemoteVideoTile: FC<{ participant: RemoteParticipantMedia }> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement || !participant.videoTrack) {
      if (videoElement) {
        videoElement.pause()
        videoElement.srcObject = null
      }

      return
    }

    videoElement.srcObject = new MediaStream([participant.videoTrack])
    void videoElement.play().catch(() => undefined)

    return () => {
      videoElement.pause()
      videoElement.srcObject = null
    }
  }, [participant.videoTrack])

  return (
    <div
      className="flex aspect-video w-full items-center justify-center overflow-hidden border border-zinc-800 bg-black"
      data-testid="private-sfu-remote-video-tile">
      {participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          data-testid="private-sfu-remote-video"
        />
      ) : (
        <div className="px-3 text-xs text-zinc-500" data-testid="private-sfu-remote-audio-only">
          Remote participant audio-only
        </div>
      )}
    </div>
  )
}
