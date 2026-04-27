'use client'

import { FC, useEffect, useMemo, useState } from 'react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { cn } from '@/lib/shared/utils/utils'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { buildStorageAccessPath } from '@app-core/files/upload-file'

const SERVER_AVATAR_COLOR_CLASSES = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
] as const

const getServerAvatarInitials = (value: string) => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'SV'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const getColorIndex = (value: string) => {
  const hash = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return hash % SERVER_AVATAR_COLOR_CLASSES.length
}

interface INavigationItemProps {
  id: string
  imageUrl: string
  name: string
}

export const NavigationItem: FC<INavigationItemProps> = ({ id, imageUrl, name }) => {
  const params = useParams()
  const router = useRouter()
  const [hasImageError, setHasImageError] = useState(false)
  const fileAccessPath = buildStorageAccessPath(imageUrl, 'serverImage')
  const avatarInitials = useMemo(() => getServerAvatarInitials(name), [name])
  const avatarColorClassName = useMemo(() => SERVER_AVATAR_COLOR_CLASSES[getColorIndex(`${name}:${id}`)], [name, id])
  const shouldShowImage = Boolean(fileAccessPath) && !hasImageError

  useEffect(() => {
    setHasImageError(false)
  }, [fileAccessPath])

  const handleServerClick = () => {
    router.push(`/servers/${id}`)
  }

  return (
    <ActionTooltip side="right" align={'center'} label={name}>
      <button className="group relative flex items-center" onClick={handleServerClick}>
        <div
          className={cn(
            'absolute left-0 bg-mainOrange rounded-r-full transition-all w-[4px]',
            params?.serverId !== id && 'group-hover:h-[20px]',
            params?.serverId === id ? 'h-[36px]' : 'h-[8px]',
          )}
        />
        <div
          className={cn(
            'relative group flex mx-3 h-[48px] w-[48px] rounded-[24px] overflow-hidden group-hover:rounded-[16px] transition-all',
          )}>
          {shouldShowImage ? (
            <Image src={fileAccessPath} fill alt={name} onError={() => setHasImageError(true)} />
          ) : (
            <div
              className={cn(
                'h-full w-full flex items-center justify-center text-white font-semibold text-sm select-none',
                avatarColorClassName,
              )}>
              {avatarInitials}
            </div>
          )}
        </div>
      </button>
    </ActionTooltip>
  )
}
