'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut, Volume2, VolumeX } from 'lucide-react'
import { logoutSession } from '@sdk/actions/auth'
import { getProfileQueryKey } from '@sdk/queries/profile'
import { useUnreadNotificationSoundPreference } from '@/lib/shared/data-access/unread/unread-notification-sound'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/lib/shared/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/lib/shared/ui/avatar'

type BackendUserMenuProps = {
  email?: string | null
  imageUrl?: string | null
  name?: string | null
}

const getInitials = (name?: string | null, email?: string | null) => {
  const normalizedName = name?.trim() || email?.trim()

  if (!normalizedName) {
    return 'AX'
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function BackendUserMenu({ email, imageUrl, name }: BackendUserMenuProps) {
  const queryClient = useQueryClient()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { enabled: isUnreadNotificationSoundEnabled, setEnabled: setUnreadNotificationSoundEnabled } =
    useUnreadNotificationSoundPreference()
  const hasProfileSnapshot = name !== undefined || email !== undefined || imageUrl !== undefined
  const displayName = name?.trim() || email?.trim() || 'Account'

  const handleLogout = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    try {
      await logoutSession()

      queryClient.setQueryData(getProfileQueryKey(), null)
      // queryClient.removeQueries({ queryKey: getProfileQueryKey() })
      // queryClient.removeQueries({ queryKey: ['servers'] })

      window.location.replace('/sign-in')
    } catch (error) {
      console.error('[BACKEND_USER_MENU_LOGOUT]', error)
      setIsSigningOut(false)
    }
  }

  if (!hasProfileSnapshot) {
    return (
      <button
        aria-label="Account is loading"
        className="rounded-full opacity-80"
        disabled
        type="button">
        <Avatar className="h-[48px] w-[48px]">
          <AvatarFallback className="bg-neutral-700 text-sm font-semibold text-white">
            <Loader2 className="h-4 w-4 animate-spin" />
          </AvatarFallback>
        </Avatar>
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open account menu"
          className="rounded-full transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          type="button">
          <Avatar className="h-[48px] w-[48px]">
            <AvatarImage src={imageUrl ?? undefined} />
            <AvatarFallback className="bg-neutral-700 text-sm font-semibold text-white">
              {getInitials(name, email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 dark:bg-gray1E" side="top">
        <DropdownMenuLabel className="space-y-1">
          <div className="font-medium text-black dark:text-white">{displayName}</div>
          {email ? <div className="text-xs font-normal text-neutral-500">{email}</div> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={isUnreadNotificationSoundEnabled}
          className="cursor-pointer gap-2 dark:focus:bg-gray21"
          onCheckedChange={(checked) => setUnreadNotificationSoundEnabled(Boolean(checked))}
          onSelect={(event) => event.preventDefault()}>
          {isUnreadNotificationSoundEnabled ? (
            <Volume2 className="mr-2 h-4 w-4" />
          ) : (
            <VolumeX className="mr-2 h-4 w-4" />
          )}
          Notification sound
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer dark:focus:bg-gray21"
          disabled={isSigningOut}
          onClick={() => void handleLogout()}>
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
