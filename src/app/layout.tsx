import type { Metadata } from 'next'
import './globals.css'
import React, { PropsWithChildren } from 'react'
import localFont from 'next/font/local'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider, ModalProvider, QueryProvider } from '@/lib/shared/providers'
import { cn } from '@/lib/shared/utils/utils'
import { Toaster } from '@/lib/shared/ui/toaster'
import { DesktopDeepLinkHandler } from '@/lib/shared/features/desktop-deep-link-handler'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'

const font = localFont({
  src: '../app/fonts/GeistVF.woff',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Ax-Connect',
  description: 'Meetings',
}

export default async function RootLayout({ children }: Readonly<PropsWithChildren>) {
  const locale = await getLocale()
  const messages = await getMessages()

  const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(font.className, 'bg-white dark:bg-[#232428]')}>
        <ClerkProvider
          {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
          afterSignOutUrl="/"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="ax-connect-theme">
            <Toaster />
            <QueryProvider>
              <NextIntlClientProvider messages={messages}>
                <DesktopDeepLinkHandler />
                <ModalProvider />
                {children}
              </NextIntlClientProvider>
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
