import React, { PropsWithChildren } from 'react'
import { NavigationSidebar } from '@/lib/navigation/features'

const MainLayout = async ({ children }: PropsWithChildren) => {
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
        <NavigationSidebar />
      </div>
      <main className="md:pl-[72px] h-full">{children}</main>
    </div>
  )
}

export default MainLayout
