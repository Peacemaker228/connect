'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/shared/ui/tooltip'
import { FC, ReactNode } from 'react'

interface IActionTooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  preserveCase?: boolean
}

export const ActionTooltip: FC<IActionTooltipProps> = ({ align, children, label, preserveCase = false, side }) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          <p className={preserveCase ? 'font-bold text-sm' : 'font-bold text-sm capitalize'}>
            {preserveCase ? label : label.toLocaleLowerCase()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
