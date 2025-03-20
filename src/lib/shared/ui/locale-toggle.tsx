'use client'

import * as React from 'react'
import { Button } from '@/lib/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/lib/shared/ui/dropdown-menu'
import { setCurrentLocale } from '../utils/locale'
import { useLocale } from 'next-intl'
import { ELocales } from '@/types'

export function LocaleToggle() {
  const locale = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-transparent border-0" variant="outlineOrange" size="icon">
          <span>{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="dark:bg-gray1E">
        <DropdownMenuRadioGroup value={locale} onValueChange={async (lang) => await setCurrentLocale(lang as ELocales)}>
          <DropdownMenuRadioItem className="dark:focus:bg-gray21 cursor-pointer" value={ELocales.RU}>
            RU
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="dark:focus:bg-gray21 cursor-pointer" value={ELocales.EN}>
            EN
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
