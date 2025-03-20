import { MemberRole } from '@prisma/client'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/shared/utils/utils'

export const roleIconMap = (isChat: boolean = false) => {
  return {
    [MemberRole.GUEST]: null,
    [MemberRole.MODERATOR]: <ShieldCheck className={cn('h-4 w-4 text-indigo-500', !isChat ? 'mr-2' : 'ml-2')} />,
    [MemberRole.ADMIN]: <ShieldAlert className={cn('h-4 w-4 mr-2 text-rose-500', !isChat ? 'mr-2' : 'ml-2')} />,
  }
}
