import type { Metadata } from 'next'
import './globals.css'
import '@axenix/ui-kit/css'
import { Open_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { cn } from '@/lib/shared/utils/utils'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ClientProviders } from '@/lib/shared/providers/client-providers'

const font = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ax-Connect',
  description: 'Meetings',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <ClerkProvider afterSignOutUrl={'/'} signInFallbackRedirectUrl={'/'} signUpFallbackRedirectUrl={'/'}>
      <html lang={locale} suppressHydrationWarning>
        <body className={cn(font.className, 'bg-white dark:bg-[#232428]')}>
          <NextIntlClientProvider messages={messages}>
            <ClientProviders>{children}</ClientProviders>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
