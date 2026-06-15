'use client'

import type { MemberDto, MemberWithProfileDto, MessageMentionDto, MessageReplyPreviewDto } from '@app-core/contracts'
import { FC, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import Image from 'next/image'
import { Check, Copy, Edit, FileIcon, Reply, Trash } from 'lucide-react'
import { cn } from '@/lib/shared/utils/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '@/lib/shared/ui/form'
import { Input } from '@/lib/shared/ui/input'
import { Button } from '@/lib/shared/ui/button'
import { useRouter } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { chatInputSchema, IChatInputSchema } from '@app-core/schemas/chat-input-schema'
import { buildStorageAccessPath, getUploadValueParts } from '@/lib/shared/utils/upload-file'
import { useUpdateMessage } from '@sdk/mutations/message'
import { MessageContent } from '@/lib/chat/features/message-content'
import { getReadableMessageEditContent } from '@/lib/chat/features/message-mention-text'
import { buildMessageCopyText, writeMessageClipboardText } from '@/lib/chat/features/message-copy'
import {
  applyMentionSuggestionToText,
  filterMentionSuggestions,
  getMentionTrigger,
  serializeSelectedMentionsForSubmit,
  updateMentionRangesForTextChange,
  type MentionSuggestion,
  type MentionTrigger,
  type SelectedMentionRange,
} from '@/lib/chat/features/mention-picker-utils'
import { MentionPickerCommand } from '@/lib/chat/features/mention-picker-command'
import { MessageReplyPreviewBlock } from '@/lib/chat/features/message-reply-preview'

const EDIT_MENTION_PICKER_MAX_HEIGHT = 320
const EDIT_MENTION_PICKER_VIEWPORT_MARGIN = 8
const EDIT_MENTION_PICKER_CHROME_HEIGHT = 20

type EditMentionPickerPlacement = {
  maxHeight: number
  side: 'bottom' | 'top'
}

interface IChatItemProps {
  id: string
  content: string
  member: MemberWithProfileDto
  createdAt: Date | string
  timestamp: string
  fileUrl: string | null
  deleted: boolean
  replyTo?: MessageReplyPreviewDto | null
  replyToDirectMessageId?: string | null
  replyToMessageId?: string | null
  currentMember: MemberDto
  isUpdated: boolean
  messageApiUrl: string
  messageQuery: Record<string, string>
  mentions?: MessageMentionDto[]
  serverId: string
  isEditing: boolean
  onStartEditing: () => void
  onCancelEditing: () => void
  onFinishEditing: () => void
  onReply: (message: MessageReplyPreviewDto) => void
  mentionSuggestions?: MentionSuggestion[]
  onNavigateToReplyTarget?: (messageId: string) => void
  onRegisterMessageElement?: (messageId: string, element: HTMLDivElement | null) => void
  isReplyNavigationHighlighted?: boolean
}

export const ChatItem: FC<IChatItemProps> = ({
  deleted,
  currentMember,
  member,
  fileUrl,
  messageApiUrl,
  messageQuery,
  isUpdated,
  timestamp,
  createdAt,
  content,
  id,
  mentions,
  replyTo,
  replyToDirectMessageId,
  replyToMessageId,
  serverId,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onFinishEditing,
  onReply,
  onNavigateToReplyTarget,
  onRegisterMessageElement,
  isReplyNavigationHighlighted = false,
  mentionSuggestions = [],
}) => {
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const mentionOptionRefs = useRef<Array<HTMLDivElement | null>>([])
  const isPointerDownInsideMentionPickerRef = useRef(false)
  const isMentionPickerOpenRef = useRef(false)
  const mentionInputSelectionRef = useRef<{ end: number; start: number } | null>(null)
  const selectedMentionRangesRef = useRef<SelectedMentionRange[]>([])
  const [isCopied, setIsCopied] = useState(false)
  const [mentionTrigger, setMentionTrigger] = useState<MentionTrigger | null>(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  const [mentionPickerPlacement, setMentionPickerPlacement] = useState<EditMentionPickerPlacement>({
    maxHeight: EDIT_MENTION_PICKER_MAX_HEIGHT,
    side: 'top',
  })
  const copyFeedbackTimeoutRef = useRef<number | null>(null)
  const { onOpen } = useModal()
  const router = useRouter()
  const { mutateAsync: updateMessage } = useUpdateMessage()

  const t = useTranslations('ChannelPage')
  const commonTranslation = useTranslations('Common')
  const editableContent = useMemo(() => getReadableMessageEditContent(content, mentions), [content, mentions])
  const canUseMentionPicker = typeof messageQuery.serverId === 'string' && typeof messageQuery.channelId === 'string'
  const visibleMentionSuggestions = useMemo(
    () => (mentionTrigger ? filterMentionSuggestions(mentionSuggestions, mentionTrigger.query) : []),
    [mentionSuggestions, mentionTrigger],
  )
  const isMentionPickerOpen = canUseMentionPicker && Boolean(mentionTrigger) && visibleMentionSuggestions.length > 0

  const updateMentionPickerPlacement = useCallback(() => {
    const editInput = editInputRef.current

    if (!editInput) {
      return
    }

    const rect = editInput.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const spaceAbove = Math.max(rect.top - EDIT_MENTION_PICKER_VIEWPORT_MARGIN, 0)
    const spaceBelow = Math.max(viewportHeight - rect.bottom - EDIT_MENTION_PICKER_VIEWPORT_MARGIN, 0)
    const shouldOpenAbove = spaceAbove >= EDIT_MENTION_PICKER_MAX_HEIGHT || spaceAbove >= spaceBelow
    const side = shouldOpenAbove ? 'top' : 'bottom'
    const availableHeight = Math.floor(shouldOpenAbove ? spaceAbove : spaceBelow)
    const maxHeight = Math.max(
      0,
      Math.min(EDIT_MENTION_PICKER_MAX_HEIGHT, availableHeight - EDIT_MENTION_PICKER_CHROME_HEIGHT),
    )

    setMentionPickerPlacement((currentPlacement) => {
      if (currentPlacement.side === side && currentPlacement.maxHeight === maxHeight) {
        return currentPlacement
      }

      return { maxHeight, side }
    })
  }, [])

  const onMemberClick = () => {
    if (member.id === currentMember.id) return

    router.push(`${ERoutes.SERVERS}/${serverId}${ERoutes.CONVERSATIONS}/${member.id}`)
  }

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content: editableContent,
    },
  })

  const closeMentionPicker = useCallback(() => {
    setMentionTrigger(null)
    setMentionSelectedIndex(0)
  }, [])

  const cancelEditing = useCallback(() => {
    selectedMentionRangesRef.current = []
    closeMentionPicker()
    form.reset({ content: editableContent })
    onCancelEditing()
  }, [closeMentionPicker, editableContent, form, onCancelEditing])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        if (isMentionPickerOpenRef.current) {
          return
        }

        cancelEditing()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cancelEditing, isEditing])

  useEffect(() => {
    isMentionPickerOpenRef.current = isMentionPickerOpen
  }, [isMentionPickerOpen])

  useEffect(() => {
    if (!isMentionPickerOpen) {
      return
    }

    updateMentionPickerPlacement()

    window.addEventListener('resize', updateMentionPickerPlacement)
    window.addEventListener('scroll', updateMentionPickerPlacement, true)

    return () => {
      window.removeEventListener('resize', updateMentionPickerPlacement)
      window.removeEventListener('scroll', updateMentionPickerPlacement, true)
    }
  }, [isMentionPickerOpen, mentionTrigger?.start, updateMentionPickerPlacement, visibleMentionSuggestions.length])

  useEffect(() => {
    const resetMentionPickerPointerState = () => {
      const shouldRestoreInputFocus = isPointerDownInsideMentionPickerRef.current && isMentionPickerOpenRef.current
      const inputElement = editInputRef.current
      const selection = mentionInputSelectionRef.current

      if (shouldRestoreInputFocus && inputElement) {
        window.requestAnimationFrame(() => {
          if (!inputElement.isConnected || !isMentionPickerOpenRef.current) {
            return
          }

          inputElement.focus({ preventScroll: true })

          if (selection) {
            const end = Math.min(selection.end, inputElement.value.length)
            const start = Math.min(selection.start, inputElement.value.length)

            inputElement.setSelectionRange(start, end)
          }
        })
      }

      window.setTimeout(() => {
        isPointerDownInsideMentionPickerRef.current = false
      }, 0)
    }

    window.addEventListener('pointerup', resetMentionPickerPointerState)
    window.addEventListener('pointercancel', resetMentionPickerPointerState)

    return () => {
      window.removeEventListener('pointerup', resetMentionPickerPointerState)
      window.removeEventListener('pointercancel', resetMentionPickerPointerState)
    }
  }, [])

  useEffect(() => {
    setMentionSelectedIndex(0)
  }, [mentionTrigger?.start, mentionTrigger?.query, visibleMentionSuggestions.length])

  useEffect(() => {
    if (!isMentionPickerOpen) {
      return
    }

    window.requestAnimationFrame(() => {
      mentionOptionRefs.current[mentionSelectedIndex]?.scrollIntoView({ block: 'nearest' })
    })
  }, [isMentionPickerOpen, mentionSelectedIndex, visibleMentionSuggestions.length])

  useEffect(() => {
    form.reset({
      content: editableContent,
    })
    selectedMentionRangesRef.current = []
    closeMentionPicker()
  }, [closeMentionPicker, editableContent, form])

  useEffect(() => {
    if (!isEditing) {
      selectedMentionRangesRef.current = []
      closeMentionPicker()
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const editInput = editInputRef.current

      if (!editInput) {
        return
      }

      editInput.focus()
      const caretPosition = editInput.value.length
      editInput.setSelectionRange(caretPosition, caretPosition)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [closeMentionPicker, isEditing, editableContent])

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        window.clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

  const { fileName, fileType, fileUrl: resolvedFileUrl } = getUploadValueParts(fileUrl ?? '', 'messageFile')
  const fileAccessPath = buildStorageAccessPath(fileUrl ?? '', 'messageFile')
  const attachmentDisplayName = fileName || resolvedFileUrl || 'Attachment'

  const isAdmin = currentMember.role === 'ADMIN'
  const isModerator = currentMember.role === 'MODERATOR'
  const isOwner = currentMember.id === member.id

  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner)
  const canEditMessage = !deleted && isOwner && !fileUrl
  const canCopyMessage = !deleted
  const canReplyMessage = !deleted
  const hasReplyTarget = Boolean(replyToMessageId || replyToDirectMessageId || replyTo)

  const imageAlt = attachmentDisplayName || 'Image attachment'
  const isPDF = fileType === 'application/pdf' && fileAccessPath
  const isImage = Boolean(fileAccessPath) && fileType?.startsWith('image')
  const isGenericFile = Boolean(fileAccessPath) && Boolean(fileType) && !isImage && !isPDF
  const isCurrentMemberMentioned = !deleted && mentions?.some((mention) => mention.memberId === currentMember.id)

  const isLoading = form.formState.isSubmitting
  const replyNavigationTargetId = replyTo?.id ?? null

  const handleMessageElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      onRegisterMessageElement?.(id, element)
    },
    [id, onRegisterMessageElement],
  )

  const handleMentionCommandValueChange = useCallback(
    (value: string) => {
      const nextIndex = visibleMentionSuggestions.findIndex((suggestion) => suggestion.id === value)

      if (nextIndex >= 0) {
        setMentionSelectedIndex(nextIndex)
      }
    },
    [visibleMentionSuggestions],
  )

  const syncMentionTrigger = useCallback(
    (element: HTMLInputElement | null) => {
      if (!element || !canUseMentionPicker) {
        setMentionTrigger(null)
        return
      }

      setMentionTrigger(getMentionTrigger(element.value, element.selectionStart ?? element.value.length))
    },
    [canUseMentionPicker],
  )

  const updateContentValue = useCallback((previousValue: string, nextValue: string) => {
    selectedMentionRangesRef.current = updateMentionRangesForTextChange(
      selectedMentionRangesRef.current,
      previousValue,
      nextValue,
    )
  }, [])

  const applyMentionSuggestion = useCallback(
    (suggestion: MentionSuggestion) => {
      const element = editInputRef.current
      const trigger = mentionTrigger

      if (!element || !trigger) {
        return
      }

      const { nextCaretPosition, nextRanges, nextValue } = applyMentionSuggestionToText(
        element.value,
        trigger,
        suggestion,
        selectedMentionRangesRef.current,
      )

      selectedMentionRangesRef.current = nextRanges
      form.setValue('content', nextValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      closeMentionPicker()

      requestAnimationFrame(() => {
        const nextElement = editInputRef.current

        if (!nextElement) {
          return
        }

        nextElement.focus()
        nextElement.setSelectionRange(nextCaretPosition, nextCaretPosition)
      })
    },
    [closeMentionPicker, form, mentionTrigger],
  )

  const handleEditKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!isMentionPickerOpen) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setMentionSelectedIndex((mentionSelectedIndex + 1) % visibleMentionSuggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setMentionSelectedIndex(
        (mentionSelectedIndex - 1 + visibleMentionSuggestions.length) % visibleMentionSuggestions.length,
      )
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMentionPicker()
      return
    }

    if ((event.key === 'Enter' && !event.nativeEvent.isComposing) || event.key === 'Tab') {
      event.preventDefault()
      applyMentionSuggestion(visibleMentionSuggestions[mentionSelectedIndex] ?? visibleMentionSuggestions[0])
    }
  }

  const handleSubmit = async (data: IChatInputSchema) => {
    try {
      const rawContent = form.getValues('content')
      const payload = {
        ...data,
        content: serializeSelectedMentionsForSubmit(rawContent, selectedMentionRangesRef.current).trim(),
      }

      await updateMessage({ apiUrl: `${messageApiUrl}/${id}`, query: messageQuery, payload })

      selectedMentionRangesRef.current = []
      closeMentionPicker()
      form.reset()
      onFinishEditing()
    } catch (err) {
      console.log(err)
    }
  }

  const handleStartEditing = () => {
    selectedMentionRangesRef.current = []
    closeMentionPicker()
    form.reset({ content: editableContent })
    onStartEditing()
  }

  const setCopiedState = () => {
    setIsCopied(true)

    if (copyFeedbackTimeoutRef.current) {
      window.clearTimeout(copyFeedbackTimeoutRef.current)
    }

    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false)
      copyFeedbackTimeoutRef.current = null
    }, 1000)
  }

  const handleCopy = async () => {
    const copyText = buildMessageCopyText({
      content,
      fileAccessPath,
      fileUrl,
      mentions,
      origin: window.location.origin,
      resolvedFileUrl,
    })

    if (!copyText) {
      return
    }

    try {
      await writeMessageClipboardText(copyText)
      setCopiedState()
    } catch (error) {
      console.error('[chat-item][copy]', error)
    }
  }

  const handleReply = () => {
    if (!canReplyMessage) {
      return
    }

    onReply({
      id,
      content,
      fileUrl,
      deleted,
      memberId: member.id,
      member,
      createdAt: new Date(createdAt),
      mentions,
    })
  }

  const copyTooltipLabel = isCopied ? t('ChatItem.copied') : t('ChatItem.copy')
  const actionIconClassName =
    'cursor-pointer w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition'

  return (
    <div
      ref={handleMessageElementRef}
      className={cn(
        'relative group flex items-center hover:bg-black/5 p-4 transition w-full',
        isCurrentMemberMentioned &&
          'border-l-4 border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-400/10 dark:hover:bg-amber-400/15',
        isReplyNavigationHighlighted &&
          'bg-violet-500/15 hover:bg-violet-500/20 dark:bg-violet-400/15 dark:hover:bg-violet-400/20',
      )}>
      <div className={'group flex gap-x-2 items-start w-full'}>
        <div onClick={onMemberClick} className={'cursor-pointer hover:drop-shadow-md transition'}>
          <UserAvatar name={member.profile.name} src={member.profile.imageUrl} />
        </div>
        <div className={'flex flex-col w-full'}>
          <div className="flex items-center gap-x-2">
            <div className={'flex items-center'}>
              <p onClick={onMemberClick} className={'font-semibold text-sm hover:underline cursor-pointer'}>
                {member.profile.name}
              </p>
              <ActionTooltip label={commonTranslation(`role.${member.role}`)}>
                {roleIconMap(true)[member.role]}
              </ActionTooltip>
            </div>
            <span className={'text-xs text-zinc-500 dark:text-zinc-400'}>{timestamp}</span>
          </div>
          {!deleted && hasReplyTarget && (
            <MessageReplyPreviewBlock
              replyTo={replyTo}
              hasReplyTarget={hasReplyTarget}
              labels={{
                attachment: t('Reply.attachment'),
                deleted: t('Reply.deleted'),
              }}
              onNavigate={
                replyNavigationTargetId && onNavigateToReplyTarget
                  ? () => onNavigateToReplyTarget(replyNavigationTargetId)
                  : undefined
              }
              className="mt-2"
            />
          )}
          {isImage && (
            <a
              href={fileAccessPath}
              target={'_blank'}
              rel={'noopener noreferrer'}
              className={
                'relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48'
              }>
              <Image src={fileAccessPath} alt={imageAlt} fill unoptimized className={'object-cover'} />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileAccessPath}
                target={'_blank'}
                rel={'noopener noreferrer'}
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
                {attachmentDisplayName}
              </a>
            </div>
          )}
          {isGenericFile && (
            <div className="relative flex max-w-xl items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 shrink-0 fill-zinc-200 stroke-zinc-500 dark:fill-zinc-700 dark:stroke-zinc-300" />
              <a
                href={fileAccessPath}
                target={'_blank'}
                rel={'noopener noreferrer'}
                className="ml-2 min-w-0 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
                {attachmentDisplayName}
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                'text-accent text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-words',
                deleted && 'italic text-zinc-500 dark:text-zinc-400 text-xs mt-1',
              )}>
              {deleted ? (
                content
              ) : (
                <MessageContent
                  content={content}
                  currentMemberId={currentMember.id}
                  mentions={mentions}
                  serverId={serverId}
                />
              )}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">({t('ChatItem.edited')})</span>
              )}
            </p>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className={'flex items-center w-full gap-x-2 pt-2'}>
                <FormField
                  render={({ field }) => (
                    <FormItem className={'flex-1'}>
                      <FormControl>
                        <div className={'relative w-full'}>
                          {isMentionPickerOpen && (
                            <MentionPickerCommand
                              suggestions={visibleMentionSuggestions}
                              selectedIndex={mentionSelectedIndex}
                              optionRefs={mentionOptionRefs}
                              onValueChange={handleMentionCommandValueChange}
                              onPointerDownCapture={() => {
                                isPointerDownInsideMentionPickerRef.current = true
                              }}
                              onSelectSuggestion={applyMentionSuggestion}
                              className={cn(
                                'absolute left-0 right-0 z-50 h-auto max-w-full overflow-hidden rounded-md border border-zinc-300 bg-white p-0 text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
                                mentionPickerPlacement.side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
                              )}
                              listClassName="p-2"
                              listStyle={{ maxHeight: mentionPickerPlacement.maxHeight }}
                            />
                          )}
                          <Input
                            {...field}
                            ref={(element) => {
                              field.ref(element)
                              editInputRef.current = element
                            }}
                            onBlur={(event) => {
                              const element = event.currentTarget

                              mentionInputSelectionRef.current = {
                                end: element.selectionEnd ?? element.value.length,
                                start: element.selectionStart ?? element.value.length,
                              }
                              field.onBlur()
                              window.setTimeout(() => {
                                if (isPointerDownInsideMentionPickerRef.current) {
                                  return
                                }

                                if (document.activeElement !== element) {
                                  closeMentionPicker()
                                }
                              }, 0)
                            }}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value

                              updateContentValue(field.value, nextValue)
                              field.onChange(nextValue)
                              syncMentionTrigger(event.currentTarget)
                            }}
                            onClick={(event) => syncMentionTrigger(event.currentTarget)}
                            onKeyDown={handleEditKeyDown}
                            onKeyUp={(event) => {
                              if (event.key !== 'Escape') {
                                syncMentionTrigger(event.currentTarget)
                              }
                            }}
                            onSelect={(event) => syncMentionTrigger(event.currentTarget)}
                            disabled={isLoading}
                            className={
                              'p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200'
                            }
                            placeholder={t('ChatItem.editMessage')}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                  name={'content'}
                  control={form.control}
                />
                <Button disabled={isLoading} size={'sm'} variant={'primary'}>
                  {t('ChatItem.save')}
                </Button>
              </form>
              <span className={'text-[10px] mt-1 text-zinc-400'}>{t('ChatItem.description')}</span>
            </Form>
          )}
        </div>
      </div>
      {(canCopyMessage || canReplyMessage) && (
        <div
          className={
            'z-10 hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 shadow-sm rounded-sm'
          }>
          {canReplyMessage && (
            <ActionTooltip label={t('ChatItem.reply')}>
              <button
                type="button"
                aria-label={t('ChatItem.reply')}
                onClick={handleReply}
                className="flex h-4 w-4 items-center justify-center">
                <Reply className={actionIconClassName} />
              </button>
            </ActionTooltip>
          )}
          <ActionTooltip label={copyTooltipLabel}>
            <button
              type="button"
              aria-label={copyTooltipLabel}
              onClick={handleCopy}
              className="flex h-4 w-4 items-center justify-center">
              {isCopied ? (
                <Check className="h-4 w-4 text-emerald-500 transition" />
              ) : (
                <Copy className={actionIconClassName} />
              )}
            </button>
          </ActionTooltip>
          {canEditMessage && (
            <ActionTooltip label={t('ChatItem.edit')}>
              <button
                type="button"
                aria-label={t('ChatItem.edit')}
                onClick={handleStartEditing}
                className="flex h-4 w-4 items-center justify-center">
                <Edit className={actionIconClassName} />
              </button>
            </ActionTooltip>
          )}
          {canDeleteMessage && (
            <ActionTooltip label={t('ChatItem.delete')}>
              <button
                type="button"
                aria-label={t('ChatItem.delete')}
                onClick={() => {
                  onOpen('deleteMessage', { apiUrl: `${messageApiUrl}/${id}`, query: messageQuery })
                }}
                className="flex h-4 w-4 items-center justify-center">
                <Trash className={actionIconClassName} />
              </button>
            </ActionTooltip>
          )}
        </div>
      )}
    </div>
  )
}
