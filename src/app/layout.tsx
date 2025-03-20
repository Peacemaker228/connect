import type { Metadata } from 'next'
import './globals.css'
import React, { PropsWithChildren } from 'react'
import { Open_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider, ModalProvider, SocketProvider, QueryProvider } from '@/lib/shared/providers'
import { cn } from '@/lib/shared/utils/utils'
import { Toaster } from '@/lib/shared/ui/toaster'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'

const font = Open_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ax-Connect',
  description: 'Meetings',
}

export default async function RootLayout({ children }: Readonly<PropsWithChildren>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <ClerkProvider afterSignOutUrl={'/'} signInFallbackRedirectUrl={'/'} signUpFallbackRedirectUrl={'/'}>
      <html lang={locale} suppressHydrationWarning>
        <body className={cn(font.className, 'bg-white dark:bg-[#232428]')}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="ax-connect-theme">
            <SocketProvider>
              <Toaster />
              <QueryProvider>
                <NextIntlClientProvider messages={messages}>
                  <ModalProvider />
                  {children}
                </NextIntlClientProvider>
              </QueryProvider>
            </SocketProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
