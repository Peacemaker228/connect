'use server'

import { cookies } from 'next/headers'
import { ECookiesKeys, ELocales } from '@/types'
import { defaultLocale, locales } from '@/lib/shared/utils/locale/index'

export async function getCurrentLocale() {
  const storedLocale = (await cookies()).get(ECookiesKeys.NEXT_LOCALE)?.value as ELocales

  if (storedLocale && locales.includes(storedLocale)) {
    return storedLocale
  }

  return defaultLocale
}

export const setCurrentLocale = async (locale: `${ELocales}`) => {
  ;(await cookies()).set(ECookiesKeys.NEXT_LOCALE, locale)
}
