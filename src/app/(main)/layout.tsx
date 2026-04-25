import React, { PropsWithChildren } from 'react'
import { NavigationSidebar } from '@/lib/navigation/features'
import { SocketProvider } from '@/lib/shared/providers'
import { getPublicApiUrl } from '@/lib/shared/utils/public-api-url'

const MainLayout = async ({ children }: PropsWithChildren) => {
  const publicApiUrl = getPublicApiUrl()

  return (
    <SocketProvider socketUrl={publicApiUrl}>
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
