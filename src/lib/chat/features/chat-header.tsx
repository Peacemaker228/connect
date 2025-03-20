import { FC } from 'react'
import { Hash } from 'lucide-react'
import { MobileToggle } from '@/lib/shared/features/mobile-toggle'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { SocketIndicator } from '@/lib/shared/features/socket-indicator'
import { TChannelConversation } from '@/types'
import { ChatVideoButton } from '@/lib/chat/features/chat-video-button'

interface IChatHeaderProps {
  serverId: string
  name: string
  type: TChannelConversation
  imageUrl?: string
}

export const ChatHeader: FC<IChatHeaderProps> = ({ imageUrl, name, type, serverId }) => {
  return (
    <div className="text-sm font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
      <MobileToggle serverId={serverId} />
      {type === 'channel' && <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />}
      {type === 'conversation' && imageUrl && <UserAvatar src={imageUrl} className="h-8 w-8 md:h-8 md:w-8 mr-2" />}
      <p className="font-semibold text-sm text-black dark:text-white">{name}</p>
      <div className="ml-auto flex items-center">
        {type === 'conversation' && <ChatVideoButton />}
        <SocketIndicator />
      </div>
    </div>
  )
}
