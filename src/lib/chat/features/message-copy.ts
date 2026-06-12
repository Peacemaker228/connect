import type { MessageMentionDto } from '@app-core/contracts'

type MentionCopyToken = {
  replacement: string
  target: string
  targetLower: string
}

interface BuildMessageCopyTextInput {
  content: string
  fileAccessPath: string
  fileUrl: string | null
  mentions?: MessageMentionDto[]
  origin: string
  resolvedFileUrl: string
}

const STORAGE_VALUE_PREFIX = 'storage://'

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const isBrokenObjectString = (value: string) => value.trim() === '[object Object]'

const getMentionLabel = (mention: MessageMentionDto) => {
  if (mention.kind === 'ALL') {
    return 'all'
  }

  return mention.member.profile.name
}

const getMentionCopyTokens = (mentions: MessageMentionDto[] = []) => {
  const tokenByTarget = new Map<string, MentionCopyToken>([
    [
      '<@all>',
      {
        replacement: '@all',
        target: '<@all>',
        targetLower: '<@all>',
      },
    ],
  ])

  mentions.forEach((mention) => {
    const label = getMentionLabel(mention)
    const stableTarget = `<@${mention.memberId}>`

    tokenByTarget.set(stableTarget.toLowerCase(), {
      replacement: `@${label}`,
      target: stableTarget,
      targetLower: stableTarget.toLowerCase(),
    })

    if (mention.kind === 'ALL') {
      tokenByTarget.set('<@all>', {
        replacement: '@all',
        target: '<@all>',
        targetLower: '<@all>',
      })
    }
  })

  return Array.from(tokenByTarget.values()).sort((a, b) => b.target.length - a.target.length)
}

export const getReadableMessageCopyContent = (content: string, mentions?: MessageMentionDto[]) => {
  if (!content || isBrokenObjectString(content)) {
    return ''
  }

  const tokens = getMentionCopyTokens(mentions)

  if (tokens.length === 0) {
    return content
  }

  const contentLower = content.toLowerCase()
  const parts: string[] = []
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

    parts.push(match.token.replacement)
    cursor = match.index + match.token.target.length
  }

  return parts.join('')
}

const toAbsoluteUrl = (value: string, origin: string) => {
  if (!value) {
    return ''
  }

  if (isAbsoluteUrl(value)) {
    return value
  }

  try {
    return new URL(value, origin).toString()
  } catch {
    return value
  }
}

const isStorageValueText = (value: string, fileUrl: string | null, resolvedFileUrl: string, fileAccessUrl: string) => {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return false
  }

  return (
    normalizedValue.startsWith(STORAGE_VALUE_PREFIX) ||
    normalizedValue === fileUrl ||
    normalizedValue === resolvedFileUrl ||
    normalizedValue === fileAccessUrl
  )
}

export const buildMessageCopyText = ({
  content,
  fileAccessPath,
  fileUrl,
  mentions,
  origin,
  resolvedFileUrl,
}: BuildMessageCopyTextInput) => {
  const readableContent = getReadableMessageCopyContent(content, mentions)

  if (!fileUrl) {
    return readableContent
  }

  const fileAccessUrl = toAbsoluteUrl(fileAccessPath || resolvedFileUrl || fileUrl, origin)
  const hasMeaningfulText =
    Boolean(readableContent.trim()) &&
    !isBrokenObjectString(readableContent) &&
    !isStorageValueText(readableContent, fileUrl, resolvedFileUrl, fileAccessUrl)

  if (hasMeaningfulText && fileAccessUrl) {
    return `${readableContent}\n${fileAccessUrl}`
  }

  return fileAccessUrl || readableContent
}

const writeTextWithLegacyClipboard = (text: string) => {
  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export const writeMessageClipboardText = async (text: string) => {
  if (typeof window !== 'undefined' && window.electron?.isDesktop) {
    const writeClipboardText = window.electron.writeClipboardText

    if (!writeClipboardText) {
      throw new Error('Desktop clipboard API is unavailable')
    }

    const isCopied = await writeClipboardText(text)

    if (!isCopied) {
      throw new Error('Desktop clipboard write rejected')
    }

    return
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (!writeTextWithLegacyClipboard(text)) {
    throw new Error('Web clipboard write rejected')
  }
}
