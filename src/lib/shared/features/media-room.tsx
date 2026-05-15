'use client'

import { FC, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { getProfileName } from '@app-core/profiles/get-profile-name'
import { ERoutes } from '@app-core/routing/routes'
import { useGetProfile } from '@sdk/queries/profile'
import { useGetServer } from '@sdk/queries/server'
import { ChannelType } from '@app-core/contracts'
import { EGeneral } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'

import { LiveKitClientAdapter } from './media/livekit-client-adapter'
import type { MediaRoomEntry } from './media/media-room-entry'
import { SfuPrivateCallAdapter } from './media/sfu-private-call-adapter'
import { useMediaRoomController } from './media/use-media-room-controller'

interface IMediaRoomProps {
  mediaEntry: MediaRoomEntry
  leaveRedirectHref?: string
  serverId: string
  video: boolean
  audio: boolean
}

export const MediaRoom: FC<IMediaRoomProps> = ({ audio, video, mediaEntry, leaveRedirectHref, serverId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useGetProfile()
  const { data: server } = useGetServer(serverId)
  const generalChannelId = server?.channels.find(
    (channel) => channel.name === EGeneral.GENERAL && channel.type === ChannelType.TEXT,
  )?.id
  const name = getProfileName({
    firstName: null,
    lastName: null,
    username: profile?.name ?? null,
  })
  const { liveKitToken, controlPlaneJoin, controlPlaneStatus, leaveControlPlane } = useMediaRoomController({
    mediaEntry,
    displayName: profile?.name ? name : null,
  })
  const isSfuProviderRequested = searchParams?.get('mediaProvider') === 'sfu' || searchParams?.get('sfu') === 'true'
  const isPrivateSfuGateRequested = mediaEntry.scope.kind === 'conversation' && isSfuProviderRequested
  const isChannelAudioSfuGateRequested =
    mediaEntry.scope.kind === 'channel' &&
    audio &&
    !video &&
    searchParams?.get('sfuChannel') === 'true' &&
    isSfuProviderRequested
  const isSfuGateRequested = isPrivateSfuGateRequested || isChannelAudioSfuGateRequested
  const isSfuGateOpen = isSfuGateRequested && process.env.NODE_ENV !== 'production'
  const sfuIceTransportPolicy =
    searchParams?.get('sfuTransport') === 'turn' || searchParams?.get('sfuIce') === 'relay' ? 'relay' : undefined
  const sfuCaptureMode = searchParams?.get('sfuCapture') === 'real' ? 'real' : 'synthetic'
  const sfuSimulateMissingCamera = searchParams?.get('sfuSimulateMissingCamera') === 'true'

  const handleLeave = useCallback(() => {
    void leaveControlPlane()
    router.replace(
      leaveRedirectHref ??
        (generalChannelId
          ? `${ERoutes.SERVERS}/${serverId}${ERoutes.CHANNELS}/${generalChannelId}`
          : `${ERoutes.SERVERS}/${serverId}`),
    )
  }, [generalChannelId, leaveControlPlane, leaveRedirectHref, router, serverId])

  if (isSfuGateOpen && controlPlaneJoin?.participantSession) {
    const isChannelAudioSfu = isChannelAudioSfuGateRequested

    return (
      <SfuPrivateCallAdapter
        controlPlaneJoin={controlPlaneJoin}
        audio={isChannelAudioSfu ? true : audio}
        video={isChannelAudioSfu ? false : video}
        iceTransportPolicy={sfuIceTransportPolicy}
        captureMode={sfuCaptureMode}
        simulateMissingCamera={sfuSimulateMissingCamera}
        roomLabel={isChannelAudioSfu ? 'SFU channel audio' : undefined}
        restartAriaLabel={isChannelAudioSfu ? 'Restart SFU channel audio' : undefined}
        onLeave={handleLeave}
      />
    )
  }

  if (liveKitToken === '' || (isSfuGateRequested && controlPlaneStatus === 'joining')) {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Подключение к звонку...</p>
      </div>
    )
  }

  return <LiveKitClientAdapter token={liveKitToken} video={video} audio={audio} onLeave={handleLeave} />
}
