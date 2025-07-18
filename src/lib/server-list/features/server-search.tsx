'use client'

import { FC, ReactElement, useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/lib/shared/ui/command'
import { useParams, useRouter } from 'next/navigation'
import { TSearchType } from '@/types'
import { useTranslations } from 'next-intl'

export interface IServerData {
  label: string
  type: TSearchType
  data:
    | {
        icon: ReactElement | null
        name: string
        id: string
      }[]
    | undefined
}

interface IServerSearchProps {
  data: IServerData[]
}

export const ServerSearch: FC<IServerSearchProps> = ({ data }) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const t = useTranslations('ServerSidebar')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => {
      document.removeEventListener('keydown', down)
    }
  }, [])

  const handleClick = ({ id, type }: { id: string; type: 'channel' | 'member' }) => {
    setOpen(false)

    if (type === 'member') {
      return router.push(`/servers/${params?.serverId}/conversations/${id}`)
    }

    if (type === 'channel') {
      return router.push(`/servers/${params?.serverId}/channels/${id}`)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
        }}
        className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
        <SearchIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
          {t('Search.label')}
        </p>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">CTRL</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('Search.placeholder')} />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          {data.map(({ label, type, data: innerData }) => {
            if (!innerData?.length) return null

            return (
              <CommandGroup key={label} heading={label}>
                {innerData.map(({ id, icon, name }) => {
                  return (
                    <CommandItem
                      onSelect={() => {
                        handleClick({ id, type })
                      }}
                      key={id}
                      className="data-[selected='true']:bg-mainOrange">
                      {icon}
                      <span>{name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
