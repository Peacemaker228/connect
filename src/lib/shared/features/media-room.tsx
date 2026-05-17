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
  const isNonProductionRuntime = process.env.NODE_ENV !== 'production'
  const isLiveKitProviderRequested =
    searchParams?.get('mediaProvider') === 'livekit' ||
    searchParams?.get('livekit') === 'true' ||
    searchParams?.get('sfu') === 'false'
  const isSfuProviderRequested =
    !isLiveKitProviderRequested && (searchParams?.get('mediaProvider') === 'sfu' || searchParams?.get('sfu') === 'true')
  const isChannelScope = mediaEntry.scope.kind === 'channel'
  const isChannelAudioSfuDefaultCandidateRequested =
    isChannelScope &&
    audio &&
    !video &&
    isNonProductionRuntime &&
    !isLiveKitProviderRequested &&
    process.env.NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_DEFAULT_CANDIDATE === '1'
  const isChannelAudioSfuProductDefaultPilotRequested =
    isChannelScope &&
    audio &&
    !video &&
    isNonProductionRuntime &&
    !isLiveKitProviderRequested &&
    process.env.NEXT_PUBLIC_MEDIA_CHANNEL_AUDIO_SFU_PRODUCT_DEFAULT_PILOT === '1'
  const isChannelVideoSfuDefaultCandidateRequested =
    isChannelScope &&
    audio &&
    video &&
    isNonProductionRuntime &&
    !isLiveKitProviderRequested &&
    process.env.NEXT_PUBLIC_MEDIA_CHANNEL_VIDEO_SFU_DEFAULT_CANDIDATE === '1'
  const isPrivateSfuGateRequested = mediaEntry.scope.kind === 'conversation' && isSfuProviderRequested
  const isChannelAudioSfuGateRequested =
    isChannelScope &&
    audio &&
    !video &&
    ((searchParams?.get('sfuChannel') === 'true' && isSfuProviderRequested) ||
      isChannelAudioSfuDefaultCandidateRequested ||
      isChannelAudioSfuProductDefaultPilotRequested)
  const sfuIceTransportPolicy =
    searchParams?.get('sfuTransport') === 'turn' || searchParams?.get('sfuIce') === 'relay' ? 'relay' : undefined
  const requestedSfuCaptureMode = searchParams?.get('sfuCapture') === 'real' ? 'real' : 'synthetic'
  const sfuCaptureMode =
    isChannelAudioSfuDefaultCandidateRequested ||
    isChannelAudioSfuProductDefaultPilotRequested ||
    isChannelVideoSfuDefaultCandidateRequested
      ? 'real'
      : requestedSfuCaptureMode
  const isChannelVideoSfuGateRequested =
    isChannelScope &&
    audio &&
    video &&
    ((searchParams?.get('sfuChannel') === 'true' &&
      searchParams?.get('sfuVideo') === 'true' &&
      sfuCaptureMode === 'real' &&
      isSfuProviderRequested) ||
      isChannelVideoSfuDefaultCandidateRequested)
  const isSfuGateRequested =
    isPrivateSfuGateRequested || isChannelAudioSfuGateRequested || isChannelVideoSfuGateRequested
  const isSfuGateOpen = isSfuGateRequested && isNonProductionRuntime
  const sfuSimulateMissingCamera = searchParams?.get('sfuSimulateMissingCamera') === 'true'
  const expectedSfuRoomId =
    mediaEntry.scope.kind === 'channel'
      ? `channel:${mediaEntry.scope.serverId}:${mediaEntry.scope.channelId}`
      : mediaEntry.scope.kind === 'conversation'
        ? `conversation:${mediaEntry.scope.serverId}:${mediaEntry.scope.conversationId}`
        : null
  const isCurrentControlPlaneJoin = controlPlaneJoin?.room.roomId === expectedSfuRoomId
  const shouldWaitForSfuControlPlane =
    isSfuGateRequested && (controlPlaneStatus === 'joining' || (controlPlaneStatus === 'joined' && !isCurrentControlPlaneJoin))

  const handleLeave = useCallback(() => {
    void leaveControlPlane()
    router.replace(
      leaveRedirectHref ??
        (generalChannelId
          ? `${ERoutes.SERVERS}/${serverId}${ERoutes.CHANNELS}/${generalChannelId}`
          : `${ERoutes.SERVERS}/${serverId}`),
    )
  }, [generalChannelId, leaveControlPlane, leaveRedirectHref, router, serverId])

  if (isSfuGateOpen && isCurrentControlPlaneJoin && controlPlaneJoin?.participantSession) {
    const isChannelAudioSfu = isChannelAudioSfuGateRequested
    const isChannelVideoSfu = isChannelVideoSfuGateRequested

    return (
      <SfuPrivateCallAdapter
        key={`${controlPlaneJoin.room.roomId}:${controlPlaneJoin.participantSession.participantSessionId}`}
        controlPlaneJoin={controlPlaneJoin}
        audio={isChannelAudioSfu ? true : audio}
        video={isChannelAudioSfu ? false : video}
        iceTransportPolicy={sfuIceTransportPolicy}
        captureMode={sfuCaptureMode}
        simulateMissingCamera={sfuSimulateMissingCamera}
        roomLabel={isChannelVideoSfu ? 'SFU channel video' : isChannelAudioSfu ? 'SFU channel audio' : undefined}
        restartAriaLabel={
          isChannelVideoSfu ? 'Restart SFU channel video' : isChannelAudioSfu ? 'Restart SFU channel audio' : undefined
        }
        remoteVideoLayout={isChannelVideoSfu ? 'participant-grid' : 'single'}
        onLeave={handleLeave}
      />
    )
  }

  if (liveKitToken === '' || shouldWaitForSfuControlPlane) {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Подключение к звонку...</p>
      </div>
    )
  }

  return <LiveKitClientAdapter token={liveKitToken} video={video} audio={audio} onLeave={handleLeave} />
}
