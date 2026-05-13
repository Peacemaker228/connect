'use client'

import { useCallback, useEffect, useState } from 'react'
import { getLiveKitToken, joinRoom, leaveRoom } from '@sdk/actions/media'
import type { JoinRoomResponse } from '@sdk/actions/media'

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

  useEffect(() => {
    if (!displayName) {
      setLiveKitToken('')
      setControlPlaneJoin(null)
      setControlPlaneStatus('idle')
      setControlPlaneError(null)
      return
    }

    let cancelled = false
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
    }
  }, [displayName, mediaEntry])

  const leaveControlPlane = useCallback(async () => {
    const participantSession = controlPlaneJoin?.participantSession

    if (!participantSession) {
      return
    }

    try {
      await leaveRoom({
        requestId: createMediaRequestId('media.leave'),
        roomId: participantSession.roomId,
        participantSessionId: participantSession.participantSessionId,
        reason: 'intentional-leave',
      })
    } catch (error) {
      console.warn('[media] control-plane leave failed after LiveKit leave', error)
    }
  }, [controlPlaneJoin?.participantSession])

  return {
    liveKitToken,
    controlPlaneJoin,
    controlPlaneStatus,
    controlPlaneError,
    leaveControlPlane,
  }
}
