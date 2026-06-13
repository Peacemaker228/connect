import type { MessageMentionDto } from '@app-core/contracts'

export type MentionRenderToken = {
  email?: string
  kind?: MessageMentionDto['kind']
  label: string
  memberId?: string
  metadataBacked?: boolean
  target: string
  targetLower: string
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
