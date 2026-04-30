'use client'

import { FC, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { MediaDeviceFailure, Room } from 'livekit-client'
import { getProfileName } from '@app-core/profiles/get-profile-name'
import { ERoutes } from '@app-core/routing/routes'
import { toast } from '@/lib/shared/utils/hooks/use-toast'
import { useGetProfile } from '@sdk/queries/profile'
import { getLiveKitToken } from '@sdk/actions/media'
import { useGetServer } from '@sdk/queries/server'
import { ChannelType } from '@prisma/client'
import { EGeneral } from '@/types'
import { useRouter } from 'next/navigation'

interface IMediaRoomProps {
  chatId: string
  leaveRedirectHref?: string
  serverId: string
  video: boolean
  audio: boolean
}

const MICROPHONE_CAPTURE_OPTIONS = {
  echoCancellation: true,
  noiseSuppression: true,
} as const

const getDeviceLabel = (kind?: MediaDeviceKind) => {
  switch (kind) {
    case 'audioinput':
      return 'микрофону'
    case 'videoinput':
      return 'камере'
    case 'audiooutput':
      return 'динамикам'
    default:
      return 'устройству'
  }
}

const getDeviceErrorDescription = (failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
  const deviceLabel = getDeviceLabel(kind)

  switch (failure) {
    case MediaDeviceFailure.DeviceInUse:
      return `Не удалось получить доступ к ${deviceLabel}: устройство уже занято другим приложением.`
    case MediaDeviceFailure.PermissionDenied:
      return `Нет доступа к ${deviceLabel}. Разрешите его в Windows и в приложении.`
    case MediaDeviceFailure.NotFound:
      return `Не удалось найти ${deviceLabel}. Проверьте подключение устройства.`
    default:
      return `Не удалось запустить доступ к ${deviceLabel}. Попробуйте закрыть другие приложения, использующие медиаустройство.`
  }
}

export const MediaRoom: FC<IMediaRoomProps> = ({ audio, video, chatId, leaveRedirectHref, serverId }) => {
  const router = useRouter()
  const { profile } = useGetProfile()
  const { data: server } = useGetServer(serverId)
  const [token, setToken] = useState('')
  const room = useMemo(() => new Room(), [])
  const isStartingMediaRef = useRef(false)
  const isLeaveRequestedRef = useRef(false)
  const generalChannelId = server?.channels.find(
    (channel) => channel.name === EGeneral.GENERAL && channel.type === ChannelType.TEXT,
  )?.id

  const showMediaFailureToast = useCallback((failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
    toast({
      title: 'Ошибка доступа к устройству',
      description: getDeviceErrorDescription(failure, kind),
    })
  }, [])

  useEffect(() => {
    const name = getProfileName({
      firstName: null,
      lastName: null,
      username: profile?.name ?? null,
    })

    if (!profile?.name) return

    ;(async () => {
      try {
        const data = await getLiveKitToken({ room: chatId, username: name })
        setToken(data.token)
      } catch (error) {
        console.error('[livekit] failed to fetch room token', error)
      }
    })()
  }, [chatId, profile?.name])

  const showMediaFailure = useCallback(
    (error: unknown, kind?: MediaDeviceKind) => {
      const mediaError = error instanceof Error ? error : new Error('Unknown media error')
      const failure = MediaDeviceFailure.getFailure(mediaError)

      console.error('[livekit] media startup failure', kind, failure, mediaError)

      showMediaFailureToast(failure, kind)
    },
    [showMediaFailureToast],
  )

  const getPreferredDeviceId = useCallback(async (kind: MediaDeviceKind) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return undefined
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const matchingDevices = devices.filter((device) => device.kind === kind)

      const preferredDevice = matchingDevices.find(
        (device) => device.deviceId !== 'default' && device.deviceId !== 'communications',
      )

      return preferredDevice?.deviceId ?? matchingDevices[0]?.deviceId
    } catch (error) {
      console.error('[livekit] failed to enumerate devices', kind, error)
      return undefined
    }
  }, [])

  const resetRequestedDevice = useCallback(
    async (kind: MediaDeviceKind) => {
      try {
        if (kind === 'audioinput') {
          await room.localParticipant.setMicrophoneEnabled(false)
          return
        }

        if (kind === 'videoinput') {
          await room.localParticipant.setCameraEnabled(false)
        }
      } catch (error) {
        console.error('[livekit] failed to reset media device', kind, error)
      }
    },
    [room],
  )

  const enableRequestedDevice = useCallback(
    async (kind: MediaDeviceKind) => {
      if (kind === 'audioinput') {
        const deviceId = await getPreferredDeviceId(kind)

        try {
          await room.localParticipant.setMicrophoneEnabled(true, {
            ...(deviceId ? { deviceId } : {}),
            ...MICROPHONE_CAPTURE_OPTIONS,
          })
        } catch (error) {
          if (!deviceId) {
            throw error
          }

          console.warn('[livekit] failed to start preferred microphone, retrying with default device', error)

          await room.localParticipant.setMicrophoneEnabled(true, {
            ...MICROPHONE_CAPTURE_OPTIONS,
          })
        }

        return
      }

      if (kind === 'videoinput') {
        const deviceId = await getPreferredDeviceId(kind)

        try {
          await room.localParticipant.setCameraEnabled(true, deviceId ? { deviceId } : undefined)
        } catch (error) {
          if (!deviceId) {
            throw error
          }

          console.warn('[livekit] failed to start preferred camera, retrying with default device', error)

          await room.localParticipant.setCameraEnabled(true)
        }
      }
    },
    [getPreferredDeviceId, room],
  )

  const startRequestedMedia = useCallback(async () => {
    if (isStartingMediaRef.current) {
      return
    }

    isStartingMediaRef.current = true

    try {
      if (audio && !room.localParticipant.isMicrophoneEnabled) {
        try {
          await enableRequestedDevice('audioinput')
        } catch (error) {
          console.error('[livekit] failed to start microphone', error)
          await resetRequestedDevice('audioinput')
          showMediaFailure(error, 'audioinput')
        }
      }

      if (video && !room.localParticipant.isCameraEnabled) {
        try {
          await enableRequestedDevice('videoinput')
        } catch (error) {
          console.error('[livekit] failed to start camera', error)
          await resetRequestedDevice('videoinput')
          showMediaFailure(error, 'videoinput')
        }
      }
    } finally {
      isStartingMediaRef.current = false
    }
  }, [audio, enableRequestedDevice, resetRequestedDevice, room, showMediaFailure, video])

  const handleConnected = useCallback(() => {
    void startRequestedMedia()
  }, [startRequestedMedia])

  const handleRoomError = useCallback((error: Error) => {
    console.error('[livekit] room error', error)
    toast({
      title: 'Ошибка подключения к звонку',
      description: error.message,
    })
  }, [])

  const handleMediaDeviceFailure = useCallback(
    (failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
      console.error('[livekit] media device failure', kind, failure)
      showMediaFailureToast(failure, kind)
    },
    [showMediaFailureToast],
  )

  const handleConferenceClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target

    if (target instanceof Element && target.closest('.lk-disconnect-button')) {
      isLeaveRequestedRef.current = true
    }
  }, [])

  const handleDisconnected = useCallback(() => {
    if (!isLeaveRequestedRef.current) {
      return
    }

    isLeaveRequestedRef.current = false
    router.replace(
      leaveRedirectHref ??
        (generalChannelId
          ? `${ERoutes.SERVERS}/${serverId}${ERoutes.CHANNELS}/${generalChannelId}`
          : `${ERoutes.SERVERS}/${serverId}`),
    )
  }, [generalChannelId, leaveRedirectHref, router, serverId])

  if (token === '') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Подключение к звонку...</p>
      </div>
    )
  }

  return (
    <LiveKitRoom
      room={room}
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={false}
      audio={false}
      lang={'ru-RU'}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      onError={handleRoomError}
      onMediaDeviceFailure={handleMediaDeviceFailure}>
      <VideoConference lang={'ru-RU'} onClickCapture={handleConferenceClickCapture} />
    </LiveKitRoom>
  )
}
