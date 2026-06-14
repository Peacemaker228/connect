'use client'

import type { MessageMentionDto } from '@app-core/contracts'
import type { MentionRenderToken } from '@/lib/chat/features/message-mention-text'
import { Fragment } from 'react'
import { getMentionTextParts } from '@/lib/chat/features/message-mention-text'
import Link from 'next/link'
import { ERoutes } from '@app-core/routing/routes'
import { cn } from '@/lib/shared/utils/utils'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'

const LINK_PATTERN = /(^|[\s([{])((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi
const LINK_TRAILING_PUNCTUATION_PATTERN = /[.,!?;:)\]}]+$/u

type LinkRenderToken = {
  href: string
  text: string
}

type MessageRenderPart = string | MentionRenderToken

const trimLinkTrailingPunctuation = (value: string) => {
  const match = LINK_TRAILING_PUNCTUATION_PATTERN.exec(value)

  if (!match?.[0]) {
    return {
      linkText: value,
      trailingText: '',
    }
  }

  return {
    linkText: value.slice(0, -match[0].length),
    trailingText: match[0],
  }
}

const getSafeLinkHref = (value: string) => {
  const href = value.toLowerCase().startsWith('www.') ? `https://${value}` : value

  try {
    const url = new URL(href)

    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

const renderTextWithLinks = (content: string, keyPrefix: string) => {
  const parts: Array<string | LinkRenderToken> = []
  let cursor = 0

  LINK_PATTERN.lastIndex = 0

  while (cursor < content.length) {
    const match = LINK_PATTERN.exec(content)

    if (!match) {
      parts.push(content.slice(cursor))
      break
    }

    const prefix = match[1] ?? ''
    const rawLinkText = match[2]
    const linkIndex = match.index + prefix.length

    if (linkIndex > cursor) {
      parts.push(content.slice(cursor, linkIndex))
    }

    const { linkText, trailingText } = trimLinkTrailingPunctuation(rawLinkText)
    const href = getSafeLinkHref(linkText)

    if (href) {
      parts.push({
        href,
        text: linkText,
      })

      if (trailingText) {
        parts.push(trailingText)
      }
    } else {
      parts.push(rawLinkText)
    }

    cursor = linkIndex + rawLinkText.length
  }

  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>
    }

    return (
      <a
        key={`${keyPrefix}-link-${index}`}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className="overflow-wrap-anywhere text-mainOrange underline underline-offset-2 hover:text-orange-500">
        {part.text}
      </a>
    )
  })
}

interface MessageContentProps {
  content: string
  currentMemberId?: string
  mentions?: MessageMentionDto[]
  serverId?: string
}

const mentionChipClassName =
  'rounded-sm bg-amber-500/15 px-1 font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'

const mentionLinkClassName = cn(
  mentionChipClassName,
  'transition hover:bg-amber-500/25 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:hover:bg-amber-400/25 dark:hover:text-amber-200 dark:focus-visible:ring-offset-zinc-900',
)

export const MessageContent = ({ content, currentMemberId, mentions, serverId }: MessageContentProps) => {
  const parts: MessageRenderPart[] = getMentionTextParts(content, mentions)

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <Fragment key={`text-${index}`}>{renderTextWithLinks(part, `text-${index}`)}</Fragment>
        }

        const mentionHref =
          serverId &&
          currentMemberId &&
          part.metadataBacked &&
          part.kind === 'USER' &&
          part.memberId &&
          part.memberId !== currentMemberId
            ? `${ERoutes.SERVERS}/${serverId}${ERoutes.CONVERSATIONS}/${part.memberId}`
            : null

        if (mentionHref) {
          return (
            <ActionTooltip key={`mention-${index}`} label={part.email ?? `@${part.label}`} preserveCase>
              <Link href={mentionHref} className={mentionLinkClassName}>
                @{part.label}
              </Link>
            </ActionTooltip>
          )
        }

        return (
          <span key={`mention-${index}`} className={mentionChipClassName}>
            @{part.label}
          </span>
        )
      })}
    </>
  )
}
