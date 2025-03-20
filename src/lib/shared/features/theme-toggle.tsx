'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/lib/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/lib/shared/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const t = useTranslations('NavSidebar')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-transparent border-0" variant="outlineOrange" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="dark:bg-gray1E">
        <DropdownMenuItem className="dark:focus:bg-gray21 cursor-pointer" onClick={() => setTheme('light')}>
          {t('Theme.Light')}
        </DropdownMenuItem>
        <DropdownMenuItem className="dark:focus:bg-gray21 cursor-pointer" onClick={() => setTheme('dark')}>
          {t('Theme.Dark')}
        </DropdownMenuItem>
        <DropdownMenuItem className="dark:focus:bg-gray21 cursor-pointer" onClick={() => setTheme('system')}>
          {t('Theme.System')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
