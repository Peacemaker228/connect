import React, { ReactNode } from 'react'
import { DesktopDownloadButton } from '@/lib/shared/features/desktop-download-button'

const LayoutAuth = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-[#121212] bg-[url('/ax.png')] bg-right bg-no-repeat bg-contain h-full flex items-center justify-center relative px-4">
      <div className="absolute left-4 top-4">
        <DesktopDownloadButton />
      </div>
      {children}
    </div>
  )
}

export default LayoutAuth
