'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Square } from 'lucide-react'
import { getMediasoupPrototypeHealth } from '@sdk/actions/media'

import { Button } from '@/lib/shared/ui/button'

import { SfuClientAdapter, type SfuClientTransportBundle } from './sfu-client-adapter'

type SmokeMode = 'direct' | 'turn'
type SmokeStatus = 'idle' | 'running' | 'pass' | 'fail' | 'blocked'

type SmokeLogEntry = {
  id: number
  label: string
  status: Exclude<SmokeStatus, 'idle'>
  detail?: string
}

type SmokeSummary = {
  mode: SmokeMode
  status: Exclude<SmokeStatus, 'idle' | 'running'>
  sendTransportId?: string
  recvTransportId?: string
  producerId?: string
  consumerId?: string
  remoteTrackState?: MediaStreamTrackState
  detail?: string
}

class SmokeBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SmokeBlockedError'
  }
}

const waitForRemoteTrackFlow = async (track: MediaStreamTrack) => {
  if (track.readyState !== 'live') {
    throw new Error(`Remote track is ${track.readyState}`)
  }

  if (!track.muted) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Remote track stayed muted after consume'))
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

export const SfuSmokeHarness = () => {
  const adapterRef = useRef<SfuClientAdapter | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const localTrackRef = useRef<MediaStreamTrack | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<SmokeStatus>('idle')
  const [logs, setLogs] = useState<SmokeLogEntry[]>([])
  const [summary, setSummary] = useState<SmokeSummary | null>(null)

  const addLog = useCallback((label: string, logStatus: Exclude<SmokeStatus, 'idle'>, detail?: string) => {
    setLogs((current) => [
      ...current,
      {
        id: current.length + 1,
        label,
        status: logStatus,
        detail,
      },
    ])
  }, [])

  const cleanup = useCallback(() => {
    adapterRef.current?.close()
    adapterRef.current = null

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

  const createSyntheticAudioTrack = async () => {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const destination = audioContext.createMediaStreamDestination()

    oscillator.frequency.value = 440
    gain.gain.value = 0.03
    oscillator.connect(gain).connect(destination)
    oscillator.start()

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const track = destination.stream.getAudioTracks()[0]

    if (!track) {
      throw new Error('Synthetic audio track was not created')
    }

    audioContextRef.current = audioContext
    oscillatorRef.current = oscillator
    localTrackRef.current = track

    return track
  }

  const assertTurnCredentials = (mode: SmokeMode, transport: SfuClientTransportBundle) => {
    if (mode !== 'turn') {
      return
    }

    const credentials = transport.backendTransport.turnCredentials

    if (!credentials?.enabled || !credentials.urls?.length) {
      throw new SmokeBlockedError(credentials?.reason ?? 'Local TURN credentials are not available')
    }
  }

  const runSmoke = useCallback(
    async (mode: SmokeMode) => {
      cleanup()
      setLogs([])
      setSummary(null)
      setStatus('running')

      const adapter = new SfuClientAdapter()
      adapterRef.current = adapter
      const includeTurnCredentials = mode === 'turn'
      const iceTransportPolicy = mode === 'turn' ? 'relay' : undefined

      let sendTransportId: string | undefined
      let recvTransportId: string | undefined
      let producerId: string | undefined
      let consumerId: string | undefined

      try {
        addLog('health', 'running')
        const health = await getMediasoupPrototypeHealth()

        if (!health.enabled || health.status !== 'ready') {
          throw new Error(health.reason ?? 'mediasoup prototype health is not ready')
        }

        addLog('health', 'pass', health.routerId)

        addLog('create send transport', 'running')
        const sendTransport = await adapter.createTransport({
          direction: 'send',
          includeTurnCredentials,
          iceTransportPolicy,
        })
        assertTurnCredentials(mode, sendTransport)
        sendTransportId = sendTransport.backendTransport.transportId
        addLog('create send transport', 'pass', sendTransportId)

        addLog('create recv transport', 'running')
        const recvTransport = await adapter.createTransport({
          direction: 'recv',
          includeTurnCredentials,
          iceTransportPolicy,
        })
        assertTurnCredentials(mode, recvTransport)
        recvTransportId = recvTransport.backendTransport.transportId
        addLog('create recv transport', 'pass', recvTransportId)

        addLog('produce local track', 'running')
        const localTrack = await createSyntheticAudioTrack()
        const produced = await adapter.produce(localTrack, {
          transportId: sendTransportId,
          stopTracks: false,
        })
        producerId = produced.backendProducer.producerId
        addLog('produce local track', 'pass', producerId)

        if (!producerId) {
          throw new Error('Backend producer id is missing')
        }

        addLog('create consumer metadata', 'running')
        const consumerMetadata = await adapter.createConsumerMetadata({
          transportId: recvTransportId,
          producerId,
        })
        consumerId = consumerMetadata.consumerId
        addLog('create consumer metadata', 'pass', consumerId)

        addLog('consume remote track', 'running')
        const consumed = await adapter.consume(consumerMetadata, {
          transportId: recvTransportId,
        })

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = new MediaStream([consumed.track])
          await remoteAudioRef.current.play().catch(() => undefined)
        }

        await waitForRemoteTrackFlow(consumed.track)
        addLog('consume remote track', 'pass', consumed.track.readyState)

        setStatus('pass')
        setSummary({
          mode,
          status: 'pass',
          sendTransportId,
          recvTransportId,
          producerId,
          consumerId,
          remoteTrackState: consumed.track.readyState,
        })
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown SFU smoke failure'
        const nextStatus = error instanceof SmokeBlockedError ? 'blocked' : 'fail'

        addLog(nextStatus === 'blocked' ? 'blocked' : 'failed', nextStatus, detail)
        setStatus(nextStatus)
        setSummary({
          mode,
          status: nextStatus,
          sendTransportId,
          recvTransportId,
          producerId,
          consumerId,
          detail,
        })
      }
    },
    [addLog, cleanup],
  )

  return (
    <div className="min-h-full bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div>
            <h1 className="text-lg font-semibold">Local SFU Smoke</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              mediasoup prototype via authenticated SDK calls
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="sfu-smoke-direct"
              onClick={() => void runSmoke('direct')}
              disabled={status === 'running'}
            >
              <Play className="mr-2 h-4 w-4" />
              Direct
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="sfu-smoke-turn"
              onClick={() => void runSmoke('turn')}
              disabled={status === 'running'}
            >
              <Play className="mr-2 h-4 w-4" />
              TURN
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Stop"
              onClick={() => {
                cleanup()
                setStatus('idle')
              }}
              disabled={status === 'idle'}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Reset"
              onClick={() => {
                cleanup()
                setStatus('idle')
                setLogs([])
                setSummary(null)
              }}
              disabled={status === 'running'}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-[140px_1fr] border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <span>Status</span>
              <span>Step</span>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.length === 0 ? (
                <div className="grid grid-cols-[140px_1fr] px-4 py-3 text-sm text-zinc-500">
                  <span>idle</span>
                  <span>No smoke run yet</span>
                </div>
              ) : (
                logs.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[140px_1fr] px-4 py-3 text-sm">
                    <span className="font-medium">{entry.status}</span>
                    <span>
                      {entry.label}
                      {entry.detail ? <span className="ml-2 text-zinc-500">{entry.detail}</span> : null}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <div className="mb-3 font-medium">Result</div>
            <dl className="space-y-2 text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="font-medium text-zinc-950 dark:text-zinc-50" data-testid="sfu-smoke-status">
                  {summary?.status ?? status}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Mode</dt>
                <dd>{summary?.mode ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Producer</dt>
                <dd className="truncate">{summary?.producerId ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Consumer</dt>
                <dd className="truncate">{summary?.consumerId ?? '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Track</dt>
                <dd>{summary?.remoteTrackState ?? '-'}</dd>
              </div>
            </dl>
            {summary?.detail ? <p className="mt-4 text-xs text-red-500">{summary.detail}</p> : null}
          </div>
        </div>

        <audio ref={remoteAudioRef} controls className="h-10 w-full" />
      </div>
    </div>
  )
}
