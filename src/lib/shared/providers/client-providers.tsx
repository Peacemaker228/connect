'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { ThemeProvider as AxProvider } from '@axenix/ui-kit'
import { ModalProvider, SocketProvider, QueryProvider } from '@/lib/shared/providers'
import { Toaster } from '@/lib/shared/ui/toaster'
import { PropsWithChildren } from 'react'

export const ClientProviders = ({ children }: PropsWithChildren) => {
  return (
    <AxProvider>
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="ax-connect-theme">
        <SocketProvider>
          <Toaster />
          <QueryProvider>
            <ModalProvider />
            {children}
          </QueryProvider>
        </SocketProvider>
      </NextThemeProvider>
    </AxProvider>
  )
}
