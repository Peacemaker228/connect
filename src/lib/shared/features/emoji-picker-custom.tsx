'use client'

import { FC } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/lib/shared/ui/popover'
import { Smile } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useTheme } from 'next-themes'

interface IEmojiPickerCustomProps {
  onChangeAction: (emoji: string) => void
}

export const EmojiPickerCustom: FC<IEmojiPickerCustomProps> = ({ onChangeAction }) => {
  const { resolvedTheme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger>
        <Smile className={'text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition'} />
      </PopoverTrigger>
      <PopoverContent
        side={'right'}
        sideOffset={40}
        className={'bg-transparent border-none shadow-none drop-shadow-none mb-16'}>
        <Picker
          data={data}
          theme={resolvedTheme}
          onEmojiSelect={(e: any) => {
            onChangeAction(e.native)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
