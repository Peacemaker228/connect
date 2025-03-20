import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/lib/shared/ui/sheet'
import { Button } from '@/lib/shared/ui/button'
import { ServerSidebar } from '@/lib/server-list/features'
import { FC } from 'react'
import { NavigationSidebar } from '@/lib/navigation/features'

interface IMobileToggleProps {
  serverId: string
}

export const MobileToggle: FC<IMobileToggleProps> = ({ serverId }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={'ghost'} size={'icon'} className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side={'left'} className={'p-0 flex gap-0'}>
        <div className="w-[72px]">
          <NavigationSidebar />
        </div>
        <ServerSidebar serverId={serverId} />
      </SheetContent>
    </Sheet>
  )
}
