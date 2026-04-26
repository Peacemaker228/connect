'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/lib/shared/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/lib/shared/ui/avatar'

type BackendUserMenuProps = {
  email?: string | null
  imageUrl?: string | null
  name?: string | null
}

const getInitials = (name?: string | null) => {
  const normalizedName = name?.trim()

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    try {
      await fetch('/api/auth/session/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['servers'] }),
      ])

      router.replace('/sign-in')
      router.refresh()
    } catch (error) {
      console.error('[BACKEND_USER_MENU_LOGOUT]', error)
      setIsSigningOut(false)
    }
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
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 dark:bg-gray1E" side="top">
        <DropdownMenuLabel className="space-y-1">
          <div className="font-medium text-black dark:text-white">{name ?? 'Account'}</div>
          {email ? <div className="text-xs font-normal text-neutral-500">{email}</div> : null}
        </DropdownMenuLabel>
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
