'use client'

import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '@/lib/shared/ui/form'
import { Plus } from 'lucide-react'
import { Input } from '@/lib/shared/ui/input'
import qs from 'query-string'
import axios from 'axios'
import { EmojiPickerCustom } from '@/lib/shared/features/emoji-picker-custom'
import { useRouter } from 'next/navigation'
import { TChannelConversation } from '@/types'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { chatInputSchema, IChatInputSchema } from '@/lib/chat/data-access/models/chatInputSchema'

interface IChatInputProps {
  apiUrl: string
  //может быть любое значение
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: Record<string, any>
  name: string
  type: TChannelConversation
}

export const ChatInput: FC<IChatInputProps> = ({ apiUrl, query, name, type }) => {
  const { onOpen } = useModal()
  const router = useRouter()
  const t = useTranslations('ChannelPage')

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: IChatInputSchema) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      })

      await axios.post(url, data)

      form.reset()
      router.refresh()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name={'content'}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className={'relative p-4 pb-6'}>
                  <button
                    type={'button'}
                    onClick={() => {
                      onOpen('messageFile', { apiUrl, query })
                    }}
                    className={
                      'absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center'
                    }>
                    <Plus className="text-white dark:text-[#313338]" />
                  </button>
                  <Input
                    {...field}
                    placeholder={`${t('message')} ${type === 'conversation' ? name : '#' + name}`}
                    disabled={isLoading}
                    className={
                      'px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200'
                    }
                  />
                  <div className="absolute top-7 right-8">
                    <EmojiPickerCustom onChangeAction={(e: string) => field.onChange(`${field.value}${e}`)} />
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
