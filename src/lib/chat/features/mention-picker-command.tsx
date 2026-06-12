'use client'

import type { CSSProperties, MutableRefObject } from 'react'
import { Fragment } from 'react'
import { AtSign } from 'lucide-react'
import { Command, CommandItem, CommandList, CommandSeparator } from '@/lib/shared/ui/command'
import { UserAvatar } from '@/lib/shared/features/user-avatar'
import { cn } from '@/lib/shared/utils/utils'
import type { MentionSuggestion } from '@/lib/chat/features/mention-picker-utils'

interface MentionPickerCommandProps {
  className: string
  listClassName?: string
  listStyle?: CSSProperties
  onPointerDownCapture: () => void
  onSelectSuggestion: (suggestion: MentionSuggestion) => void
  onValueChange: (value: string) => void
  optionRefs: MutableRefObject<Array<HTMLDivElement | null>>
  selectedIndex: number
  style?: CSSProperties
  suggestions: MentionSuggestion[]
}

export const MentionPickerCommand = ({
  className,
  listClassName = 'max-h-[min(31rem,calc(100dvh-12rem))] p-2',
  listStyle,
  onPointerDownCapture,
  onSelectSuggestion,
  onValueChange,
  optionRefs,
  selectedIndex,
  style,
  suggestions,
}: MentionPickerCommandProps) => {
  const hasVisibleMentionMembers = suggestions.some((suggestion) => suggestion.type === 'member')

  return (
    <Command
      shouldFilter={false}
      value={suggestions[selectedIndex]?.id ?? ''}
      onValueChange={onValueChange}
      onPointerDownCapture={onPointerDownCapture}
      style={style}
      className={className}>
      <CommandList className={listClassName} style={listStyle}>
        {suggestions.map((suggestion, index) => {
          const isSelected = index === selectedIndex

          return (
            <Fragment key={suggestion.id}>
              {suggestion.type === 'all' && hasVisibleMentionMembers && (
                <CommandSeparator className="my-1 bg-zinc-200 dark:bg-zinc-700" />
              )}
              <CommandItem
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                value={suggestion.id}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onSelectSuggestion(suggestion)
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-zinc-700 transition dark:text-zinc-200',
                  isSelected
                    ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/70',
                )}>
                {suggestion.type === 'all' ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
                    <AtSign className="h-4 w-4" />
                  </span>
                ) : (
                  <UserAvatar
                    name={suggestion.member.profile.name}
                    src={suggestion.member.profile.imageUrl}
                    className="h-8 w-8 md:h-8 md:w-8"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {suggestion.type === 'all' ? '@all' : `@${suggestion.label}`}
                  </span>
                  {suggestion.type === 'member' && (
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {suggestion.member.profile.email}
                    </span>
                  )}
                </span>
              </CommandItem>
            </Fragment>
          )
        })}
      </CommandList>
    </Command>
  )
}
