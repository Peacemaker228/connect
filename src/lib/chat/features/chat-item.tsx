'use client'

import type { MemberDto, MemberWithProfileDto } from '@app-core/contracts'
import { FC, useEffect, useState } from 'react'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { roleIconMap } from '@/lib/shared/utils/role-icon-map'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, FileIcon, Trash } from 'lucide-react'
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
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()
  const { mutateAsync: updateMessage } = useUpdateMessage()

  const t = useTranslations('ChannelPage')
  const commonTranslation = useTranslations('Common')

  const onMemberClick = () => {
    if (member.id === currentMember.id) return

    router.push(`${ERoutes.SERVERS}/${params?.serverId}${ERoutes.CONVERSATIONS}/${member.id}`)
  }

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content,
    },
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        setIsEditing(false)
        form.reset({ content })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [content, form, isEditing])

  useEffect(() => {
    form.reset({
      content,
    })
  }, [content, form])

  const { fileType, fileUrl: resolvedFileUrl } = getUploadValueParts(fileUrl ?? '', 'messageFile')
  const fileAccessPath = buildStorageAccessPath(fileUrl ?? '', 'messageFile')

  const isAdmin = currentMember.role === 'ADMIN'
  const isModerator = currentMember.role === 'MODERATOR'
  const isOwner = currentMember.id === member.id

  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner)
  const canEditMessage = !deleted && isOwner && !fileUrl

  const isPDF = fileType === 'application/pdf' && fileAccessPath
  const isImage = Boolean(fileAccessPath) && fileType?.startsWith('image')

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: IChatInputSchema) => {
    try {
      await updateMessage({ apiUrl: `${messageApiUrl}/${id}`, query: messageQuery, payload: data })

      form.reset()
      setIsEditing(false)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
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
            <Link
              href={fileAccessPath}
              target={'_blank'}
              rel={'noopener noreferrer'}
              className={
                'relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48'
              }>
              <Image src={fileAccessPath} alt={content} fill className={'object-cover'} />
            </Link>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <Link
                href={fileAccessPath}
                target={'_blank'}
                rel={'noopener noreferrer'}
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
                {resolvedFileUrl}
              </Link>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                'text-accent text-zinc-600 dark:text-zinc-300',
                deleted && 'italic text-zinc-500 dark:text-zinc-400 text-xs mt-1',
              )}>
              {content}
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
      {canDeleteMessage && (
        <div
          className={
            'hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 shadow-sm rounded-sm'
          }>
          {canEditMessage && (
            <ActionTooltip label={t('ChatItem.edit')}>
              <Edit
                onClick={() => setIsEditing(true)}
                className={
                  'cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
                }
              />
            </ActionTooltip>
          )}
          <ActionTooltip label={t('ChatItem.delete')}>
            <Trash
              onClick={() => {
                onOpen('deleteMessage', { apiUrl: `${messageApiUrl}/${id}`, query: messageQuery })
              }}
              className={
                'cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
              }
            />
          </ActionTooltip>
        </div>
      )}
    </div>
  )
}
