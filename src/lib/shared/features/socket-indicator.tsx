'use client'

import { useSocket } from '@/lib/shared/providers/socket-provider'
import { Badge } from '@/lib/shared/ui/badge'
import { useTranslations } from 'next-intl'

export const SocketIndicator = () => {
  const { isConnected } = useSocket()
  const t = useTranslations('ChannelPage')

  if (!isConnected) {
    return (
      <Badge variant={'outline'} className={'bg-yellow-600 text-white'}>
        {t('connection.polling')}
      </Badge>
    )
  }

  return (
    <Badge variant={'outline'} className={'bg-emerald-600 text-white'}>
      {t('connection.connected')}
    </Badge>
  )
}
