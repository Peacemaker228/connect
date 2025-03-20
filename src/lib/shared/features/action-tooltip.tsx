'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/shared/ui/tooltip'
import { FC, ReactNode } from 'react'

interface IActionTooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export const ActionTooltip: FC<IActionTooltipProps> = ({ align, children, label, side }) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          <p className="font-bold text-sm capitalize">{label.toLocaleLowerCase()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
