import type { MessageMentionDto } from '@app-core/contracts'

const FALLBACK_MENTION_PATTERN = /(^|[\s.,!?;:()[\]{}"'`])(@all|@[^\s.,!?;:()[\]{}"'`<>]+)/gi

export type MentionRenderToken = {
  email?: string
  kind?: MessageMentionDto['kind']
  label: string
  memberId?: string
  metadataBacked?: boolean
  target: string
  targetLower: string
}

export type MentionTextPart = string | MentionRenderToken

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

export const getMessageMentionLabel = (mention: MessageMentionDto) => {
  if (mention.kind === 'ALL') {
    return 'all'
  }

  return mention.member.profile.name
}

export const getMentionRenderTokens = (mentions: MessageMentionDto[] = []) => {
  const tokenByTarget = new Map<string, MentionRenderToken>()

  const setMentionRenderToken = (target: string, mention: MessageMentionDto, label: string) => {
    tokenByTarget.set(target.toLowerCase(), {
      email: mention.kind === 'USER' ? mention.member.profile.email : undefined,
      kind: mention.kind,
      label,
      memberId: mention.memberId,
      metadataBacked: true,
      target,
      targetLower: target.toLowerCase(),
    })
  }

  mentions.forEach((mention) => {
    const label = getMessageMentionLabel(mention)
    const stableTarget = `<@${mention.memberId}>`

    setMentionRenderToken(stableTarget, mention, label)

    if (mention.kind === 'ALL') {
      setMentionRenderToken('<@all>', mention, 'all')
      setMentionRenderToken('@all', mention, 'all')
      return
    }

    setMentionRenderToken(`@${label}`, mention, label)
  })

  return Array.from(tokenByTarget.values()).sort((a, b) => b.target.length - a.target.length)
}

export const getMentionTextParts = (content: string, mentions?: MessageMentionDto[]) => {
  const tokens = getMentionRenderTokens(mentions)
  const canUseRawFallback = mentions === undefined
  const contentLower = content.toLowerCase()
  const parts: MentionTextPart[] = []
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

  return parts
}

export const getReadableMessageEditContent = (content: string, mentions: MessageMentionDto[] = []) => {
  if (mentions.length === 0) {
    return content
  }

  return mentions.reduce((nextContent, mention) => {
    const label = getMessageMentionLabel(mention)
    const stableTargets = mention.kind === 'ALL' ? [`<@${mention.memberId}>`, '<@all>'] : [`<@${mention.memberId}>`]

    return stableTargets.reduce((contentToReplace, stableTarget) => {
      return contentToReplace.replaceAll(stableTarget, `@${label}`)
    }, nextContent)
  }, content)
}
