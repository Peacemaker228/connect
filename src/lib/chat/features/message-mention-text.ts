import type { MessageMentionDto } from '@app-core/contracts'

export type MentionRenderToken = {
  label: string
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
  const rawLabels = new Set<string>()

  mentions.forEach((mention) => {
    const label = getMessageMentionLabel(mention)
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
