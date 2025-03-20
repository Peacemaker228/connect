import React, { ReactNode } from 'react'

const LayoutAuth = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-[#121212] bg-[url('/ax.png')] bg-right bg-no-repeat bg-contain h-full flex items-center justify-center">
      {children}
    </div>
  )
}

export default LayoutAuth
