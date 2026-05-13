'use client'

import { FC, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getProfileName } from '@app-core/profiles/get-profile-name'
import { ERoutes } from '@app-core/routing/routes'
import { useGetProfile } from '@sdk/queries/profile'
import { getLiveKitToken } from '@sdk/actions/media'
import { useGetServer } from '@sdk/queries/server'
import { ChannelType } from '@app-core/contracts'
import { EGeneral } from '@/types'
import { useRouter } from 'next/navigation'

import { LiveKitClientAdapter } from './media/livekit-client-adapter'

interface IMediaRoomProps {
  chatId: string
  leaveRedirectHref?: string
  serverId: string
  video: boolean
  audio: boolean
}

export const MediaRoom: FC<IMediaRoomProps> = ({ audio, video, chatId, leaveRedirectHref, serverId }) => {
  const router = useRouter()
  const { profile } = useGetProfile()
  const { data: server } = useGetServer(serverId)
  const [token, setToken] = useState('')
  const generalChannelId = server?.channels.find(
    (channel) => channel.name === EGeneral.GENERAL && channel.type === ChannelType.TEXT,
  )?.id

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

  const handleLeave = useCallback(() => {
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

  return <LiveKitClientAdapter token={token} video={video} audio={audio} onLeave={handleLeave} />
}
