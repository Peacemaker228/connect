'use client'

import { useEffect, useRef } from 'react'
import { useGlobalUnreadSummary } from '@sdk/queries/unread'

const UNREAD_TITLE_PREFIX_RE = /^\(\d+\+?\)\s+/
const DEFAULT_TITLE = 'Ax-Connect'

const formatUnreadTitleCount = (count: number) => {
  if (count > 99) {
    return '99+'
  }

  return String(count)
}

export const UnreadDocumentTitle = () => {
  const { data: globalUnreadSummary } = useGlobalUnreadSummary()
  const baseTitleRef = useRef<string | null>(null)
  const totalUnreadCount = globalUnreadSummary?.totalUnreadCount ?? 0

  useEffect(() => {
    baseTitleRef.current = (document.title || DEFAULT_TITLE).replace(UNREAD_TITLE_PREFIX_RE, '') || DEFAULT_TITLE

    return () => {
      if (baseTitleRef.current) {
        document.title = baseTitleRef.current
      }
    }
  }, [])

  useEffect(() => {
    const baseTitle =
      baseTitleRef.current ??
      ((document.title || DEFAULT_TITLE).replace(UNREAD_TITLE_PREFIX_RE, '') || DEFAULT_TITLE)

    baseTitleRef.current = baseTitle
    document.title =
      totalUnreadCount > 0 ? `(${formatUnreadTitleCount(totalUnreadCount)}) ${baseTitle}` : baseTitle
  }, [totalUnreadCount])

  return null
}
