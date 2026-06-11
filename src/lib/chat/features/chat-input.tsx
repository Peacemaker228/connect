'use client'

import { ClipboardEvent, FC, KeyboardEvent, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { Form, FormControl, FormField, FormItem } from '@/lib/shared/ui/form'
import { Plus } from 'lucide-react'
import { EmojiPickerCustom } from '@/lib/shared/features/emoji-picker-custom'
import { useRouter } from 'next/navigation'
import { TChannelConversation } from '@/types'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { chatInputSchema, IChatInputSchema } from '@app-core/schemas/chat-input-schema'
import { useCreateMessage } from '@sdk/mutations/message'
import type { ChatMessagesPage } from '@sdk/queries/chat'
import { CHAT_COMPOSER_FOCUS_EVENT, CHAT_SCROLL_TO_BOTTOM_EVENT } from '@/lib/shared/utils/chat-events'

const CHAT_INPUT_LINE_HEIGHT = 20
const CHAT_INPUT_VERTICAL_PADDING = 28
const CHAT_INPUT_MAX_VISIBLE_LINES = 20
const CHAT_INPUT_MAX_HEIGHT = CHAT_INPUT_LINE_HEIGHT * CHAT_INPUT_MAX_VISIBLE_LINES + CHAT_INPUT_VERTICAL_PADDING
const CLIPBOARD_SCREENSHOT_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

const createClipboardScreenshotName = (date = new Date()) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  const hours = padDatePart(date.getHours())
  const minutes = padDatePart(date.getMinutes())
  const seconds = padDatePart(date.getSeconds())

  return `screenshot-${year}${month}${day}-${hours}${minutes}${seconds}`
}

const getClipboardImageFile = (clipboardData: DataTransfer) => {
  const itemImage = Array.from(clipboardData.items).find(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  )
  const sourceFile =
    itemImage?.getAsFile() ?? Array.from(clipboardData.files).find((file) => file.type.startsWith('image/'))

  if (!sourceFile || !sourceFile.type.startsWith('image/')) {
    return null
  }

  const fileType = sourceFile.type || 'image/png'
  const extension = CLIPBOARD_SCREENSHOT_EXTENSION_BY_TYPE[fileType] ?? 'png'

  return new File([sourceFile], `${createClipboardScreenshotName()}.${extension}`, {
    type: fileType,
    lastModified: Date.now(),
  })
}

type FocusMode = 'entry' | 'after-send'

const isFocusBlockingElement = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  const tagName = element.tagName.toLowerCase()

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable) {
    return true
  }

  return Boolean(
    element.closest(
      '[role="dialog"], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"], [data-radix-popper-content-wrapper]',
    ),
  )
}

interface IChatInputProps {
  messageApiUrl: string
  //может быть любое значение
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageQuery: Record<string, any>
  name: string
  type: TChannelConversation
}

export const ChatInput: FC<IChatInputProps> = ({ messageApiUrl, messageQuery, name, type }) => {
  const { isOpen: isAnyModalOpen, onOpen } = useModal()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('ChannelPage')
  const { mutateAsync: createMessage } = useCreateMessage()
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const isAnyModalOpenRef = useRef(isAnyModalOpen)
  const shouldFocusAfterSendRef = useRef(false)
  const activeChatId =
    typeof messageQuery.channelId === 'string'
      ? messageQuery.channelId
      : typeof messageQuery.conversationId === 'string'
        ? messageQuery.conversationId
        : null
  const chatFocusKey =
    activeChatId && typeof messageQuery.channelId === 'string'
      ? `channel:${activeChatId}`
      : activeChatId
        ? `conversation:${activeChatId}`
        : messageApiUrl

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    isAnyModalOpenRef.current = isAnyModalOpen
  }, [isAnyModalOpen])

  const resizeInput = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) {
      return
    }

    element.style.height = '0px'
    element.style.height = `${Math.min(element.scrollHeight, CHAT_INPUT_MAX_HEIGHT)}px`
    element.style.overflowY = element.scrollHeight > CHAT_INPUT_MAX_HEIGHT ? 'auto' : 'hidden'
  }, [])

  const canFocusInput = useCallback((element: HTMLTextAreaElement, mode: FocusMode) => {
    if (isAnyModalOpenRef.current || document.visibilityState !== 'visible') {
      return false
    }

    const activeElement = document.activeElement

    if (!activeElement || activeElement === element || activeElement === document.body) {
      return true
    }

    if (mode === 'entry') {
      return !isFocusBlockingElement(activeElement)
    }

    return false
  }, [])

  const focusInputIfSafe = useCallback((mode: FocusMode) => {
    const element = inputRef.current

    if (!element || !canFocusInput(element, mode)) {
      return false
    }

    element.focus()
    resizeInput(element)

    return true
  }, [canFocusInput, resizeInput])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      focusInputIfSafe('entry')
    })
    const timeout = window.setTimeout(() => {
      focusInputIfSafe('entry')
    }, 75)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [chatFocusKey, focusInputIfSafe])

  useEffect(() => {
    const handleComposerFocus = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail?.chatId !== activeChatId) {
        return
      }

      requestAnimationFrame(() => {
        focusInputIfSafe('after-send')
      })
    }

    window.addEventListener(CHAT_COMPOSER_FOCUS_EVENT, handleComposerFocus)

    return () => {
      window.removeEventListener(CHAT_COMPOSER_FOCUS_EVENT, handleComposerFocus)
    }
  }, [activeChatId, focusInputIfSafe])

  useEffect(() => {
    const stopAutofocus = (event: Event) => {
      if (!shouldFocusAfterSendRef.current) {
        return
      }

      if (event.target !== inputRef.current) {
        shouldFocusAfterSendRef.current = false
      }
    }

    window.addEventListener('pointerdown', stopAutofocus, true)

    return () => {
      window.removeEventListener('pointerdown', stopAutofocus, true)
    }
  }, [])

  const focusInputAfterSend = useCallback(() => {
    const focusInput = (isLastAttempt = false) => {
      const element = inputRef.current

      if (!element || !shouldFocusAfterSendRef.current) {
        return
      }

      if (canFocusInput(element, 'after-send')) {
        element.focus()
        resizeInput(element)
      }

      if (isLastAttempt) {
        shouldFocusAfterSendRef.current = false
      }
    }

    requestAnimationFrame(() => focusInput())
    window.setTimeout(() => focusInput(), 50)
    window.setTimeout(() => focusInput(true), 150)
  }, [canFocusInput, resizeInput])

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedImage = getClipboardImageFile(event.clipboardData)

    if (!pastedImage) {
      return
    }

    event.preventDefault()
    shouldFocusAfterSendRef.current = false
    onOpen('messageFile', { apiUrl: messageApiUrl, initialFile: pastedImage, query: messageQuery })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()

    if (isLoading) {
      return
    }

    shouldFocusAfterSendRef.current = true
    event.currentTarget.form?.requestSubmit()
  }

  const handleSubmit = async (data: IChatInputSchema) => {
    shouldFocusAfterSendRef.current = document.activeElement === inputRef.current || shouldFocusAfterSendRef.current

    try {
      const createdMessage = await createMessage({ apiUrl: messageApiUrl, query: messageQuery, payload: data })
      const chatId =
        typeof messageQuery.channelId === 'string'
          ? messageQuery.channelId
          : typeof messageQuery.conversationId === 'string'
            ? messageQuery.conversationId
            : null

      if (chatId) {
        const chatQueryKey = [`chat:${chatId}`]

        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatQueryKey, (oldData) => {
          if (!oldData || oldData.pages.length === 0) {
            return oldData
          }

          if (oldData.pages.some((page) => page.items.some((message) => message.id === createdMessage.id))) {
            return oldData
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page, index) =>
              index === 0 ? { ...page, items: [createdMessage, ...page.items] } : page,
            ),
          }
        })
        window.dispatchEvent(new CustomEvent(CHAT_SCROLL_TO_BOTTOM_EVENT, { detail: { chatId } }))
      }

      form.reset()
      router.refresh()
      focusInputAfterSend()
    } catch (err) {
      shouldFocusAfterSendRef.current = false
      console.log(err)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, () => {
          shouldFocusAfterSendRef.current = false
        })}>
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
                      onOpen('messageFile', { apiUrl: messageApiUrl, query: messageQuery })
                    }}
                    className={
                      'absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center'
                    }>
                    <Plus className="text-white dark:text-[#313338]" />
                  </button>
                  <textarea
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event)
                      resizeInput(event.currentTarget)
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    ref={(element) => {
                      field.ref(element)
                      inputRef.current = element
                      resizeInput(element)
                    }}
                    rows={1}
                    placeholder={`${t('message')} ${type === 'conversation' ? name : '#' + name}`}
                    disabled={isLoading}
                    className={
                      'chat-message-input min-h-[48px] w-full resize-none rounded-md px-14 py-3.5 text-sm leading-5 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                    }
                  />
                  <div className="absolute top-7 right-8">
                    <EmojiPickerCustom
                      onChangeAction={(e: string) => {
                        field.onChange(`${field.value}${e}`)
                        requestAnimationFrame(() => resizeInput(inputRef.current))
                      }}
                    />
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
