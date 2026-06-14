'use client'

import type { MessageReplyPreviewDto } from '@app-core/contracts'
import { Button } from '@/lib/shared/ui/button'
import { cn } from '@/lib/shared/utils/utils'
import { getReadableMessageCopyContent } from '@/lib/chat/features/message-copy'
import { X } from 'lucide-react'

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

  const readableContent = getReadableMessageCopyContent(replyTo.content, replyTo.mentions).replace(/\s+/g, ' ').trim()

  return readableContent || labels.attachment
}

export const MessageReplyPreviewBlock = ({
  className,
  hasReplyTarget = true,
  labels,
  onCancel,
  replyTo,
}: MessageReplyPreviewBlockProps) => {
  if (!hasReplyTarget) {
    return null
  }

  const authorName = replyTo && !replyTo.deleted ? replyTo.member.profile.name : null
  const previewText = getMessageReplyPreviewText(replyTo, labels)

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-xl items-start gap-2 border-l-2 border-mainOrange/80 pl-2 text-xs text-zinc-500 dark:text-zinc-400',
        className,
      )}>
      <div className="min-w-0 flex-1">
        {authorName && <p className="truncate font-semibold text-zinc-700 dark:text-zinc-200">{authorName}</p>}
        <p className={cn('truncate', !authorName && 'italic')}>{previewText}</p>
      </div>
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
