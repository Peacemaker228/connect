'use client'

import type { MemberDto, MemberWithProfileDto, MessageMentionDto } from '@app-core/contracts'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import Image from 'next/image'
import { Check, Copy, Edit, FileIcon, Trash } from 'lucide-react'
import { cn } from '@/lib/shared/utils/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '@/lib/shared/ui/form'
import { Input } from '@/lib/shared/ui/input'
import { Button } from '@/lib/shared/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { chatInputSchema, IChatInputSchema } from '@app-core/schemas/chat-input-schema'
import { buildStorageAccessPath, getUploadValueParts } from '@/lib/shared/utils/upload-file'
import { useUpdateMessage } from '@sdk/mutations/message'
import { MessageContent } from '@/lib/chat/features/message-content'
import { getReadableMessageEditContent } from '@/lib/chat/features/message-mention-text'
import { buildMessageCopyText, writeMessageClipboardText } from '@/lib/chat/features/message-copy'

interface IChatItemProps {
  id: string
  content: string
  member: MemberWithProfileDto
  timestamp: string
  fileUrl: string | null
  deleted: boolean
  currentMember: MemberDto
  isUpdated: boolean
  messageApiUrl: string
  messageQuery: Record<string, string>
  mentions?: MessageMentionDto[]
  isEditing: boolean
  onStartEditing: () => void
  onCancelEditing: () => void
  onFinishEditing: () => void
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
  content,
  id,
  mentions,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onFinishEditing,
}) => {
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const copyFeedbackTimeoutRef = useRef<number | null>(null)
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()
  const { mutateAsync: updateMessage } = useUpdateMessage()

  const t = useTranslations('ChannelPage')
  const commonTranslation = useTranslations('Common')
  const editableContent = useMemo(() => getReadableMessageEditContent(content, mentions), [content, mentions])

  const onMemberClick = () => {
    if (member.id === currentMember.id) return

    router.push(`${ERoutes.SERVERS}/${params?.serverId}${ERoutes.CONVERSATIONS}/${member.id}`)
  }

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content: editableContent,
    },
  })

  const cancelEditing = useCallback(() => {
    form.reset({ content: editableContent })
    onCancelEditing()
  }, [editableContent, form, onCancelEditing])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        cancelEditing()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cancelEditing, isEditing])

  useEffect(() => {
    form.reset({
      content: editableContent,
    })
  }, [editableContent, form])

  useEffect(() => {
    if (!isEditing) {
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
  }, [isEditing, editableContent])

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        window.clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

  const { fileType, fileUrl: resolvedFileUrl } = getUploadValueParts(fileUrl ?? '', 'messageFile')
  const fileAccessPath = buildStorageAccessPath(fileUrl ?? '', 'messageFile')

  const isAdmin = currentMember.role === 'ADMIN'
  const isModerator = currentMember.role === 'MODERATOR'
  const isOwner = currentMember.id === member.id

  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner)
  const canEditMessage = !deleted && isOwner && !fileUrl
  const canCopyMessage = !deleted

  const imageAlt = resolvedFileUrl || 'Image attachment'
  const isPDF = fileType === 'application/pdf' && fileAccessPath
  const isImage = Boolean(fileAccessPath) && fileType?.startsWith('image')
  const isCurrentMemberMentioned = !deleted && mentions?.some((mention) => mention.memberId === currentMember.id)

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: IChatInputSchema) => {
    try {
      await updateMessage({ apiUrl: `${messageApiUrl}/${id}`, query: messageQuery, payload: data })

      form.reset()
      onFinishEditing()
    } catch (err) {
      console.log(err)
    }
  }

  const handleStartEditing = () => {
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

  const copyTooltipLabel = isCopied ? t('ChatItem.copied') : t('ChatItem.copy')
  const actionIconClassName =
    'cursor-pointer w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition'

  return (
    <div
      className={cn(
        'relative group flex items-center hover:bg-black/5 p-4 transition w-full',
        isCurrentMemberMentioned &&
          'border-l-4 border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-400/10 dark:hover:bg-amber-400/15',
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
                {resolvedFileUrl}
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                'text-accent text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-words',
                deleted && 'italic text-zinc-500 dark:text-zinc-400 text-xs mt-1',
              )}>
              {deleted ? content : <MessageContent content={content} mentions={mentions} />}
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
                          <Input
                            {...field}
                            ref={(element) => {
                              field.ref(element)
                              editInputRef.current = element
                            }}
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
      {canCopyMessage && (
        <div
          className={
            'hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 shadow-sm rounded-sm'
          }>
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
