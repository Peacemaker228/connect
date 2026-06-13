'use client'

import { ClipboardEvent, FC, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { Form, FormControl, FormField, FormItem } from '@/lib/shared/ui/form'
import { Button } from '@/lib/shared/ui/button'
import { Plus, SendHorizontal } from 'lucide-react'
import { EmojiPickerCustom } from '@/lib/shared/features/emoji-picker-custom'
import { useRouter } from 'next/navigation'
import { TChannelConversation } from '@/types'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { chatInputSchema, IChatInputSchema } from '@app-core/schemas/chat-input-schema'
import { useCreateMessage } from '@sdk/mutations/message'
import type { ChatMessagesPage } from '@sdk/queries/chat'
import { CHAT_COMPOSER_FOCUS_EVENT, CHAT_SCROLL_TO_BOTTOM_EVENT } from '@/lib/shared/utils/chat-events'
import { useGetServer } from '@sdk/queries/server'
import { MentionPickerCommand } from '@/lib/chat/features/mention-picker-command'
import {
  applyMentionSuggestionToText,
  createMentionSuggestions,
  filterMentionSuggestions,
  getMentionTrigger,
  serializeSelectedMentionsForSubmit,
  updateMentionRangesForTextChange,
  type MentionSuggestion,
  type MentionTrigger,
  type SelectedMentionRange,
} from './mention-picker-utils'

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
  const mentionOptionRefs = useRef<Array<HTMLDivElement | null>>([])
  const isPointerDownInsideMentionPickerRef = useRef(false)
  const isMentionPickerOpenRef = useRef(false)
  const mentionInputSelectionRef = useRef<{ end: number; start: number } | null>(null)
  const isAnyModalOpenRef = useRef(isAnyModalOpen)
  const shouldFocusAfterSendRef = useRef(false)
  const isSubmitLockedRef = useRef(false)
  const selectedMentionRangesRef = useRef<SelectedMentionRange[]>([])
  const [mentionTrigger, setMentionTrigger] = useState<MentionTrigger | null>(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
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
  const channelServerId = type === 'channel' && typeof messageQuery.serverId === 'string' ? messageQuery.serverId : ''
  const { data: mentionServer } = useGetServer(channelServerId)
  const mentionServerMembers = mentionServer?.id === channelServerId ? mentionServer.members : null
  const mentionSuggestions = useMemo(
    () => (channelServerId && mentionServerMembers ? createMentionSuggestions(mentionServerMembers) : []),
    [channelServerId, mentionServerMembers],
  )
  const visibleMentionSuggestions = useMemo(
    () => (mentionTrigger ? filterMentionSuggestions(mentionSuggestions, mentionTrigger.query) : []),
    [mentionSuggestions, mentionTrigger],
  )
  const isMentionPickerOpen = type === 'channel' && Boolean(mentionTrigger) && visibleMentionSuggestions.length > 0

  const form = useForm<IChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      content: '',
    },
  })

  const isLoading = form.formState.isSubmitting
  const contentValue = form.watch('content')
  const serializedContentValue = useMemo(
    () => serializeSelectedMentionsForSubmit(contentValue ?? '', selectedMentionRangesRef.current).trim(),
    [contentValue],
  )
  const isSendDisabled = isLoading || serializedContentValue.length === 0

  useEffect(() => {
    isAnyModalOpenRef.current = isAnyModalOpen
  }, [isAnyModalOpen])

  useEffect(() => {
    isMentionPickerOpenRef.current = isMentionPickerOpen
  }, [isMentionPickerOpen])

  useEffect(() => {
    const resetMentionPickerPointerState = () => {
      const shouldRestoreInputFocus = isPointerDownInsideMentionPickerRef.current && isMentionPickerOpenRef.current
      const inputElement = inputRef.current
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

  const selectMentionIndex = useCallback((nextIndex: number) => {
    setMentionSelectedIndex(nextIndex)
  }, [])

  useEffect(() => {
    if (!isMentionPickerOpen) {
      return
    }

    window.requestAnimationFrame(() => {
      mentionOptionRefs.current[mentionSelectedIndex]?.scrollIntoView({ block: 'nearest' })
    })
  }, [isMentionPickerOpen, mentionSelectedIndex, visibleMentionSuggestions.length])

  const handleMentionCommandValueChange = useCallback(
    (value: string) => {
      const nextIndex = visibleMentionSuggestions.findIndex((suggestion) => suggestion.id === value)

      if (nextIndex >= 0) {
        setMentionSelectedIndex(nextIndex)
      }
    },
    [visibleMentionSuggestions],
  )

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

  const focusInputIfSafe = useCallback(
    (mode: FocusMode) => {
      const element = inputRef.current

      if (!element || !canFocusInput(element, mode)) {
        return false
      }

      element.focus()
      resizeInput(element)

      return true
    },
    [canFocusInput, resizeInput],
  )

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

  const syncMentionTrigger = useCallback(
    (element: HTMLTextAreaElement | null) => {
      if (!element || type !== 'channel' || !channelServerId) {
        setMentionTrigger(null)
        return
      }

      setMentionTrigger(getMentionTrigger(element.value, element.selectionStart ?? element.value.length))
    },
    [channelServerId, type],
  )

  const updateContentValue = useCallback((previousValue: string, nextValue: string) => {
    selectedMentionRangesRef.current = updateMentionRangesForTextChange(
      selectedMentionRangesRef.current,
      previousValue,
      nextValue,
    )
  }, [])

  const closeMentionPicker = useCallback(() => {
    setMentionTrigger(null)
    setMentionSelectedIndex(0)
  }, [])

  const applyMentionSuggestion = useCallback(
    (suggestion: MentionSuggestion) => {
      const element = inputRef.current
      const trigger = mentionTrigger

      if (!element || !trigger) {
        return
      }

      const { nextValue, nextCaretPosition, nextRanges } = applyMentionSuggestionToText(
        element.value,
        trigger,
        suggestion,
        selectedMentionRangesRef.current,
      )

      selectedMentionRangesRef.current = nextRanges
      form.setValue('content', nextValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
      closeMentionPicker()

      requestAnimationFrame(() => {
        const nextElement = inputRef.current

        if (!nextElement) {
          return
        }

        nextElement.focus()
        nextElement.setSelectionRange(nextCaretPosition, nextCaretPosition)
        resizeInput(nextElement)
      })
    },
    [closeMentionPicker, form, mentionTrigger, resizeInput],
  )

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedImage = getClipboardImageFile(event.clipboardData)

    if (!pastedImage) {
      return
    }

    event.preventDefault()
    shouldFocusAfterSendRef.current = false
    closeMentionPicker()
    onOpen('messageFile', { apiUrl: messageApiUrl, initialFile: pastedImage, query: messageQuery })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionPickerOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        selectMentionIndex((mentionSelectedIndex + 1) % visibleMentionSuggestions.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        selectMentionIndex(
          (mentionSelectedIndex - 1 + visibleMentionSuggestions.length) % visibleMentionSuggestions.length,
        )
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        closeMentionPicker()
        return
      }

      if ((event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) || event.key === 'Tab') {
        event.preventDefault()
        applyMentionSuggestion(visibleMentionSuggestions[mentionSelectedIndex] ?? visibleMentionSuggestions[0])
        return
      }
    }

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
    if (isSubmitLockedRef.current) {
      return
    }

    isSubmitLockedRef.current = true
    shouldFocusAfterSendRef.current = document.activeElement === inputRef.current || shouldFocusAfterSendRef.current

    try {
      const rawContent = form.getValues('content')
      const payload = {
        ...data,
        content: serializeSelectedMentionsForSubmit(rawContent, selectedMentionRangesRef.current).trim(),
      }
      const createdMessage = await createMessage({ apiUrl: messageApiUrl, query: messageQuery, payload })
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

      selectedMentionRangesRef.current = []
      closeMentionPicker()
      form.reset()
      router.refresh()
      focusInputAfterSend()
    } catch (err) {
      shouldFocusAfterSendRef.current = false
      console.log(err)
    } finally {
      isSubmitLockedRef.current = false
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
                      closeMentionPicker()
                      onOpen('messageFile', { apiUrl: messageApiUrl, query: messageQuery })
                    }}
                    className={
                      'absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center'
                    }>
                    <Plus className="text-white dark:text-[#313338]" />
                  </button>
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
                      className="absolute mb-2 right-4 bottom-[calc(100%-1rem)] left-4 z-50 h-auto max-w-[calc(100%-2rem)] overflow-hidden rounded-md border border-zinc-300 bg-white p-0 text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  )}
                  <textarea
                    name={field.name}
                    value={field.value}
                    onBlur={(event) => {
                      const element = event.currentTarget

                      mentionInputSelectionRef.current = {
                        end: element.selectionEnd,
                        start: element.selectionStart,
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
                      resizeInput(event.currentTarget)
                      syncMentionTrigger(event.currentTarget)
                    }}
                    onClick={(event) => syncMentionTrigger(event.currentTarget)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={(event) => {
                      if (event.key !== 'Escape') {
                        syncMentionTrigger(event.currentTarget)
                      }
                    }}
                    onPaste={handlePaste}
                    onSelect={(event) => syncMentionTrigger(event.currentTarget)}
                    ref={(element) => {
                      field.ref(element)
                      inputRef.current = element
                      resizeInput(element)
                    }}
                    rows={1}
                    placeholder={`${t('message')} ${type === 'conversation' ? name : '#' + name}`}
                    disabled={isLoading}
                    className={
                      'chat-message-input min-h-[48px] w-full resize-none rounded-md py-3.5 pl-14 pr-24 text-sm leading-5 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                    }
                  />
                  <div className="absolute top-6 right-7 flex items-center gap-2">
                    <EmojiPickerCustom
                      onChangeAction={(e: string) => {
                        const nextValue = `${field.value}${e}`

                        updateContentValue(field.value, nextValue)
                        field.onChange(nextValue)
                        closeMentionPicker()
                        requestAnimationFrame(() => resizeInput(inputRef.current))
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      aria-label={t('sendMessage')}
                      title={t('sendMessage')}
                      disabled={isSendDisabled}
                      onMouseDown={() => {
                        shouldFocusAfterSendRef.current = true
                      }}
                      className="h-8 w-8 rounded-full [&_svg]:size-5 text-zinc-500 hover:bg-zinc-300/70 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600/70 dark:hover:text-zinc-100">
                      <SendHorizontal className="text-mainOrange" />
                    </Button>
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
