'use client'

import type { MessageMentionDto } from '@app-core/contracts'
import type { MentionRenderToken } from '@/lib/chat/features/message-mention-text'
import { Fragment } from 'react'
import { getMentionRenderTokens } from '@/lib/chat/features/message-mention-text'

const FALLBACK_MENTION_PATTERN = /(^|[\s.,!?;:()[\]{}"'`])(@all|@[^\s.,!?;:()[\]{}"'`<>]+)/gi
const LINK_PATTERN = /(^|[\s([{])((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi
const LINK_TRAILING_PUNCTUATION_PATTERN = /[.,!?;:)\]}]+$/u

type LinkRenderToken = {
  href: string
  text: string
}

type MessageRenderPart = string | MentionRenderToken

const findFallbackMentionMatch = (content: string, cursor: number) => {
  FALLBACK_MENTION_PATTERN.lastIndex = cursor

  const match = FALLBACK_MENTION_PATTERN.exec(content)

  if (!match) {
    return null
  }

  const prefix = match[1] ?? ''
  const target = match[2]
  const index = match.index + prefix.length

  return {
    index,
    token: {
      label: target.slice(1),
      target,
      targetLower: target.toLowerCase(),
    },
  }
}

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
  mentions?: MessageMentionDto[]
}

export const MessageContent = ({ content, mentions }: MessageContentProps) => {
  const tokens = getMentionRenderTokens(mentions)
  const canUseRawFallback = mentions === undefined
  const contentLower = content.toLowerCase()
  const parts: MessageRenderPart[] = []
  let cursor = 0

  while (cursor < content.length) {
    const metadataMatch = tokens
      .map((token) => ({ token, index: contentLower.indexOf(token.targetLower, cursor) }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index || b.token.target.length - a.token.target.length)[0]
    const fallbackMatch = canUseRawFallback ? findFallbackMentionMatch(content, cursor) : null
    const match =
      metadataMatch && fallbackMatch
        ? metadataMatch.index <= fallbackMatch.index
          ? metadataMatch
          : fallbackMatch
        : (metadataMatch ?? fallbackMatch)

    if (!match) {
      parts.push(content.slice(cursor))
      break
    }

    if (match.index > cursor) {
      parts.push(content.slice(cursor, match.index))
    }

    parts.push(match.token)
    cursor = match.index + match.token.target.length
  }

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <Fragment key={`text-${index}`}>{renderTextWithLinks(part, `text-${index}`)}</Fragment>
        }

        return (
          <span
            key={`mention-${index}`}
            className="rounded-sm bg-amber-500/15 px-1 font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            @{part.label}
          </span>
        )
      })}
    </>
  )
}
