'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/lib/shared/ui/button'
import { getDesktopDownloadUrl } from '@/lib/shared/utils/desktop-download'

interface IDesktopDownloadButtonProps {
  compact?: boolean
  className?: string
}

export const DesktopDownloadButton = ({ compact = false, className }: IDesktopDownloadButtonProps) => {
  const t = useTranslations('NavSidebar')
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsDesktop(Boolean(window.electron?.isDesktop))
  }, [])

  if (isDesktop || process.env.NODE_ENV === 'development') {
    return null
  }

  return (
    <Button asChild className={className} size={compact ? 'icon' : 'sm'} variant={'outlineOrange'}>
      <a href={getDesktopDownloadUrl()} rel="noreferrer" target="_blank">
        <Download className="h-4 w-4" />
        {!compact && <span>{t('DownloadDesktop')}</span>}
      </a>
    </Button>
  )
}
