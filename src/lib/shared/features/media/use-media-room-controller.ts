'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getLiveKitToken, joinRoom, leaveRoom, leaveRoomKeepAlive } from '@sdk/actions/media'
import type { JoinRoomResponse } from '@sdk/actions/media'
import type { MediaDisconnectReason } from '@app-core/contracts'

import type { MediaRoomEntry } from './media-room-entry'

type MediaControlPlaneStatus = 'idle' | 'joining' | 'joined' | 'fallback' | 'failed'

type UseMediaRoomControllerInput = {
  mediaEntry: MediaRoomEntry
  displayName?: string | null
}

const createMediaRequestId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}:${crypto.randomUUID()}`
  }

  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`
}

export const useMediaRoomController = ({ mediaEntry, displayName }: UseMediaRoomControllerInput) => {
  const [liveKitToken, setLiveKitToken] = useState('')
  const [controlPlaneJoin, setControlPlaneJoin] = useState<JoinRoomResponse | null>(null)
  const [controlPlaneStatus, setControlPlaneStatus] = useState<MediaControlPlaneStatus>('idle')
  const [controlPlaneError, setControlPlaneError] = useState<unknown>(null)
  const [joinEpoch, setJoinEpoch] = useState(0)
  const activeParticipantSessionRef = useRef<JoinRoomResponse['participantSession'] | null>(null)
  const closedParticipantSessionIdsRef = useRef(new Set<string>())

  const closeParticipantSession = useCallback(
    async (
      participantSession: JoinRoomResponse['participantSession'],
      reason: MediaDisconnectReason,
      options: { keepAlive?: boolean } = {},
    ) => {
      if (closedParticipantSessionIdsRef.current.has(participantSession.participantSessionId)) {
        return
      }

      closedParticipantSessionIdsRef.current.add(participantSession.participantSessionId)

      if (activeParticipantSessionRef.current?.participantSessionId === participantSession.participantSessionId) {
        activeParticipantSessionRef.current = null
      }

      const payload = {
        requestId: createMediaRequestId('media.leave'),
        roomId: participantSession.roomId,
        participantSessionId: participantSession.participantSessionId,
        reason,
      }

      try {
        if (options.keepAlive && leaveRoomKeepAlive(payload)) {
          return
        }

        await leaveRoom(payload)
      } catch (error) {
        console.warn('[media] control-plane leave failed', error)
      }
    },
    [],
  )

  useEffect(() => {
    if (!displayName) {
      setLiveKitToken('')
      setControlPlaneJoin(null)
      setControlPlaneStatus('idle')
      setControlPlaneError(null)

      const participantSession = activeParticipantSessionRef.current

      if (participantSession) {
        void closeParticipantSession(participantSession, 'intentional-leave')
      }

      return
    }

    let cancelled = false
    let joinedParticipantSession: JoinRoomResponse['participantSession'] | null = null
    setLiveKitToken('')
    setControlPlaneJoin(null)
    setControlPlaneStatus('joining')
    setControlPlaneError(null)

    const controlPlaneJoinPromise = joinRoom({
      requestId: createMediaRequestId('media.join'),
      scope: mediaEntry.scope,
      mode: mediaEntry.mode,
      desiredState: mediaEntry.desiredState,
    })
      .then((result) => {
        joinedParticipantSession = result.participantSession
        activeParticipantSessionRef.current = result.participantSession

        if (cancelled) {
          void closeParticipantSession(result.participantSession, 'intentional-leave')
          return result
        }

        if (!cancelled) {
          setControlPlaneJoin(result)
          setControlPlaneStatus('joined')
        }

        return result
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn('[media] control-plane join failed, keeping LiveKit fallback active', error)
          setControlPlaneError(error)
          setControlPlaneStatus('fallback')
        }

        return null
      })

    ;(async () => {
      try {
        const data = await getLiveKitToken({
          room: mediaEntry.legacyLiveKitRoomId,
          username: displayName,
        })

        if (!cancelled) {
          setLiveKitToken(data.token)
        }
      } catch (error) {
        console.error('[livekit] failed to fetch room token', error)

        const controlPlaneResult = await controlPlaneJoinPromise
        const transitionalToken = controlPlaneResult?.providerAccess?.token

        if (!cancelled && transitionalToken) {
          setLiveKitToken(transitionalToken)
        }

        if (!cancelled && !transitionalToken) {
          setControlPlaneStatus('failed')
        }
      }
    })()

    return () => {
      cancelled = true

      if (joinedParticipantSession) {
        void closeParticipantSession(joinedParticipantSession, 'intentional-leave')
      }
    }
  }, [closeParticipantSession, displayName, joinEpoch, mediaEntry])

  useEffect(() => {
    const closeActiveSessionOnPageHide = () => {
      const participantSession = activeParticipantSessionRef.current

      if (!participantSession) {
        return
      }

      void closeParticipantSession(participantSession, 'page-refresh', {
        keepAlive: true,
      })
    }

    window.addEventListener('pagehide', closeActiveSessionOnPageHide)
    window.addEventListener('beforeunload', closeActiveSessionOnPageHide)

    return () => {
      window.removeEventListener('pagehide', closeActiveSessionOnPageHide)
      window.removeEventListener('beforeunload', closeActiveSessionOnPageHide)
    }
  }, [closeParticipantSession])

  const leaveControlPlane = useCallback(async () => {
    const participantSession = activeParticipantSessionRef.current ?? controlPlaneJoin?.participantSession

    if (!participantSession) {
      return
    }

    setControlPlaneJoin(null)
    setControlPlaneStatus('idle')
    await closeParticipantSession(participantSession, 'intentional-leave')
  }, [closeParticipantSession, controlPlaneJoin?.participantSession])

  const rejoinControlPlane = useCallback(async () => {
    const participantSession = activeParticipantSessionRef.current ?? controlPlaneJoin?.participantSession

    setControlPlaneJoin(null)
    setControlPlaneStatus('joining')

    if (participantSession) {
      await closeParticipantSession(participantSession, 'transport-failure')
    }

    setJoinEpoch((current) => current + 1)
  }, [closeParticipantSession, controlPlaneJoin?.participantSession])

  return {
    liveKitToken,
    controlPlaneJoin,
    controlPlaneStatus,
    controlPlaneError,
    leaveControlPlane,
    rejoinControlPlane,
  }
}
