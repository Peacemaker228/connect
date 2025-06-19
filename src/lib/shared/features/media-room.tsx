'use client'

import { FC, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'

interface IMediaRoomProps {
  chatId: string
  video: boolean
  audio: boolean
}

export const MediaRoom: FC<IMediaRoomProps> = ({ audio, video, chatId }) => {
  const { user } = useUser()
  const [token, setToken] = useState('')

  useEffect(() => {
    if (!user?.username && !user?.firstName && !user?.lastName) return

    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username

    ;(async () => {
      try {
        const response = await fetch(`/api/livekit?room=${chatId}&username=${name}`)
        const data = await response.json()
        setToken(data.token)
      } catch (error) {
        console.log(error)
      }
    })()
  }, [chatId, user?.firstName, user?.lastName, user?.username])

  if (token === '') {
    return (
      <div className={'flex flex-col flex-1 justify-center items-center'}>
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Загрузка...</p>
      </div>
    )
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
      lang={'ru-RU'}
      onDisconnected={(reason) => {
        console.log(reason)
      }}>
      <VideoConference lang={'ru-RU'} />
    </LiveKitRoom>
  )
}
