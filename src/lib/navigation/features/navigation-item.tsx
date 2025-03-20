'use client'

import { FC } from 'react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { cn } from '@/lib/shared/utils/utils'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface INavigationItemProps {
  id: string
  imageUrl: string
  name: string
}

export const NavigationItem: FC<INavigationItemProps> = ({ id, imageUrl, name }) => {
  const params = useParams()
  const router = useRouter()

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
          <Image src={imageUrl} fill alt={'Channel'} />
        </div>
      </button>
    </ActionTooltip>
  )
}
