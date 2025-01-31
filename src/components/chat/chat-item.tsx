'use client'

import { Member, Profile } from '@prisma/client'
import { FC, useEffect, useState } from 'react'
import { UserAvatar } from '@/components/user-avatar'
import { ActionTooltip } from '@/components/action-tooltip'
import { roleIconMap } from '@/lib/role-icon-map'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, FileIcon, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { chatInputSchema, IChatInputSchema } from '@/models/chatInputSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import qs from 'query-string'
import axios from 'axios'
import { useModal } from '@/hooks/use-modal-store'
import { useParams, useRouter } from 'next/navigation'
import { ERoutes } from '@/lib/routes'

interface IChatItemProps {
  id: string
  content: string
  member: Member & {
    profile: Profile
  }
  timestamp: string
  fileUrl: string | null
  deleted: boolean
  currentMember: Member
  isUpdated: boolean
  socketUrl: string
  socketQuery: Record<string, string>
}

export const ChatItem: FC<IChatItemProps> = ({
  deleted,
  currentMember,
  member,
  fileUrl,
  socketUrl,
  socketQuery,
  isUpdated,
  timestamp,
  content,
  id,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()

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

  const fileType = fileUrl?.split('/').slice(-2).join('/')

  const isAdmin = currentMember.role === 'ADMIN'
  const isModerator = currentMember.role === 'MODERATOR'
  const isOwner = currentMember.id === member.id

  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner)
  const canEditMessage = !deleted && isOwner && !fileUrl

  const isPDF = fileType === 'application/pdf' && fileUrl
  const isImage = !isPDF && fileUrl

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: IChatInputSchema) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      })

      await axios.patch(url, data)

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
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className={'flex flex-col w-full'}>
          <div className="flex items-center gap-x-2">
            <div className={'flex items-center'}>
              <p onClick={onMemberClick} className={'font-semibold text-sm hover:underline cursor-pointer'}>
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>{roleIconMap(true)[member.role]}</ActionTooltip>
            </div>
            <span className={'text-xs text-zinc-500 dark:text-zinc-400'}>{timestamp}</span>
          </div>
          {isImage && (
            <Link
              href={fileUrl}
              target={'_blank'}
              rel={'noopener noreferrer'}
              className={
                'relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48'
              }>
              <Image src={fileUrl} alt={content} fill className={'object-cover'} />
            </Link>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <Link
                href={fileUrl}
                target={'_blank'}
                rel={'noopener noreferrer'}
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
                {fileUrl}
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
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">(ред.)</span>
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
                            placeholder={'Отредактируйте сообщение'}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                  name={'content'}
                  control={form.control}
                />
                <Button disabled={isLoading} size={'sm'} variant={'primary'}>
                  Сохранить
                </Button>
              </form>
              <span className={'text-[10px] mt-1 text-zinc-400'}>
                Нажмите ESC, чтобы отменить редактирование, нажмите Enter, чтобы сохранить
              </span>
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
            <ActionTooltip label={'Редактировать'}>
              <Edit
                onClick={() => setIsEditing(true)}
                className={
                  'cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
                }
              />
            </ActionTooltip>
          )}
          <ActionTooltip label={'Удалить'}>
            <Trash
              onClick={() => {
                onOpen('deleteMessage', { apiUrl: `${socketUrl}/${id}`, query: socketQuery })
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
