import React, { PropsWithChildren } from 'react'
import { NavigationSidebar } from '@/lib/navigation/features'
import { SocketProvider } from '@/lib/shared/providers'
import { getPublicApiOrigin } from '@/lib/shared/utils/public-api-url'
import { UnreadDocumentTitle } from '@/lib/shared/features/unread-document-title'

const MainLayout = async ({ children }: PropsWithChildren) => {
  const publicApiOrigin = getPublicApiOrigin()

  return (
    <SocketProvider socketUrl={publicApiOrigin}>
      <UnreadDocumentTitle />
      <div className="h-full">
        <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
          <NavigationSidebar />
        </div>
        <main className="md:pl-[72px] h-full">{children}</main>
      </div>
    </SocketProvider>
  )
}

export default MainLayout
