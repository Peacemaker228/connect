'use client'

import type { MessageReplyPreviewDto } from '@app-core/contracts'
import { Button } from '@/lib/shared/ui/button'
import { cn } from '@/lib/shared/utils/utils'
import { getMentionTextParts } from '@/lib/chat/features/message-mention-text'
import { X } from 'lucide-react'
import { Fragment } from 'react'

type MessageReplyPreviewLabels = {
  attachment: string
  cancel?: string
  deleted: string
}

interface MessageReplyPreviewBlockProps {
  className?: string
  hasReplyTarget?: boolean
  labels: MessageReplyPreviewLabels
  onCancel?: () => void
  onNavigate?: () => void
  replyTo?: MessageReplyPreviewDto | null
}

const getMessageReplyPreviewText = (
  replyTo: MessageReplyPreviewDto | null | undefined,
  labels: MessageReplyPreviewLabels,
) => {
  if (!replyTo || replyTo.deleted) {
    return labels.deleted
  }

  if (replyTo.fileUrl) {
    return labels.attachment
  }

  const readableContent = replyTo.content.replace(/\s+/g, ' ').trim()

  return readableContent || labels.attachment
}

const replyMentionChipClassName =
  'rounded-sm bg-amber-500/15 px-0.5 font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'

const renderReplyPreviewText = (
  replyTo: MessageReplyPreviewDto | null | undefined,
  labels: MessageReplyPreviewLabels,
) => {
  if (!replyTo || replyTo.deleted || replyTo.fileUrl) {
    return getMessageReplyPreviewText(replyTo, labels)
  }

  const content = replyTo.content.replace(/\s+/g, ' ').trim()

  if (!content) {
    return labels.attachment
  }

  const parts = getMentionTextParts(content, replyTo.mentions)

  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <Fragment key={`reply-text-${index}`}>{part}</Fragment>
    }

    return (
      <span key={`reply-mention-${index}`} className={replyMentionChipClassName}>
        @{part.label}
      </span>
    )
  })
}

export const MessageReplyPreviewBlock = ({
  className,
  hasReplyTarget = true,
  labels,
  onCancel,
  onNavigate,
  replyTo,
}: MessageReplyPreviewBlockProps) => {
  if (!hasReplyTarget) {
    return null
  }

  const authorName = replyTo && !replyTo.deleted ? replyTo.member.profile.name : null
  const previewText = renderReplyPreviewText(replyTo, labels)
  const canNavigate = Boolean(onNavigate && replyTo && !replyTo.deleted)
  const previewContent = (
    <>
      {authorName && <p className="truncate font-semibold text-zinc-700 dark:text-zinc-200">{authorName}</p>}
      <p className={cn('truncate', !authorName && 'italic')}>{previewText}</p>
    </>
  )

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-xl items-start gap-2 border-l-2 border-mainOrange/80 pl-2 text-xs text-zinc-500 dark:text-zinc-400',
        className,
      )}>
      {canNavigate ? (
        <button
          type="button"
          aria-label="Scroll to replied message"
          title="Scroll to replied message"
          onClick={onNavigate}
          className="min-w-0 flex-1 cursor-pointer text-left transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mainOrange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:text-zinc-200 dark:focus-visible:ring-offset-zinc-900">
          {previewContent}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{previewContent}</div>
      )}
      {onCancel && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={labels.cancel}
          title={labels.cancel}
          onClick={onCancel}
          className="h-6 w-6 shrink-0 rounded-full text-zinc-500 hover:bg-zinc-300/70 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600/70 dark:hover:text-zinc-100">
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
