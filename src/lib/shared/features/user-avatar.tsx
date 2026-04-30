import { FC } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/lib/shared/ui/avatar'
import { cn } from '@/lib/shared/utils/utils'

interface IUserAvatarProps {
  name?: string | null
  src?: string
  className?: string
}

const getAvatarFallback = (name?: string | null) => {
  const normalizedName = name?.trim()

  if (!normalizedName) {
    return 'AX'
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export const UserAvatar: FC<IUserAvatarProps> = ({ name, src, className } = {}) => {
  return (
    <Avatar className={cn('h-7 w-7 md:h-10 md:w-10', className)}>
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-neutral-700 text-xs font-semibold text-white">
        {getAvatarFallback(name)}
      </AvatarFallback>
    </Avatar>
  )
}
