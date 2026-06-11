'use client'

import type { MessageMentionDto } from '@app-core/contracts'
import { Fragment } from 'react'

type MentionRenderToken = {
  label: string
  target: string
  targetLower: string
}

const getMentionLabel = (mention: MessageMentionDto) => {
  if (mention.kind === 'ALL') {
    return 'all'
  }

  return mention.member.profile.name
}

const getMentionRenderTokens = (mentions: MessageMentionDto[] = []) => {
  const tokenByTarget = new Map<string, MentionRenderToken>()
  const rawLabels = new Set<string>()

  mentions.forEach((mention) => {
    const label = getMentionLabel(mention)
    const stableTarget = `<@${mention.memberId}>`

    tokenByTarget.set(stableTarget, {
      label,
      target: stableTarget,
      targetLower: stableTarget.toLowerCase(),
    })

    if (mention.kind === 'ALL') {
      tokenByTarget.set('<@all>', {
        label: 'all',
        target: '<@all>',
        targetLower: '<@all>',
      })
      rawLabels.add('all')
      return
    }

    rawLabels.add(label)
  })

  rawLabels.forEach((label) => {
    const target = `@${label}`

    tokenByTarget.set(target.toLowerCase(), {
      label,
      target,
      targetLower: target.toLowerCase(),
    })
  })

  return Array.from(tokenByTarget.values()).sort((a, b) => b.target.length - a.target.length)
}

interface MessageContentProps {
  content: string
  mentions?: MessageMentionDto[]
}

export const MessageContent = ({ content, mentions }: MessageContentProps) => {
  const tokens = getMentionRenderTokens(mentions)

  if (tokens.length === 0) {
    return <>{content}</>
  }

  const contentLower = content.toLowerCase()
  const parts: Array<string | MentionRenderToken> = []
  let cursor = 0

  while (cursor < content.length) {
    const match = tokens
      .map((token) => ({ token, index: contentLower.indexOf(token.targetLower, cursor) }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index || b.token.target.length - a.token.target.length)[0]

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
          return <Fragment key={`text-${index}`}>{part}</Fragment>
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
