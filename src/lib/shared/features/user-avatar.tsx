import { FC } from 'react'
import { Avatar, AvatarImage } from '@/lib/shared/ui/avatar'
import { cn } from '@/lib/shared/utils/utils'

interface IUserAvatarProps {
  src?: string
  className?: string
}

export const UserAvatar: FC<IUserAvatarProps> = ({ src, className } = {}) => {
  return (
    <Avatar className={cn('h-7 w-7 md:h-10 md:w-10', className)}>
      <AvatarImage src={src} />
    </Avatar>
  )
}
