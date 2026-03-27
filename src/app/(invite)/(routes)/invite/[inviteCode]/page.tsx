'use client'

import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { useJoinByInvite } from '@/lib/shared/data-access/server/api-socket'
import { ERoutes, getSignInRedirectUrl } from '@/lib/shared/utils/routes'

const InvitePage = () => {
  const router = useRouter()
  const { inviteCode } = useParams() as { inviteCode?: string }
  const { isLoaded, userId } = useAuth()

  const hasJoinedRef = useRef(false)
  const { mutateAsync: joinByInvite, isError, isPending } = useJoinByInvite()

  useEffect(() => {
    if (!inviteCode || hasJoinedRef.current || !isLoaded) {
      return
    }

    if (!userId) {
      hasJoinedRef.current = true
      router.replace(getSignInRedirectUrl(`/invite/${inviteCode}`))
      return
    }

    hasJoinedRef.current = true

    const join = async () => {
      try {
        const { redirectUrl } = await joinByInvite(inviteCode)
        router.replace(redirectUrl)
      } catch (error) {
        console.error('Invite failed:', error)

        if (axios.isAxiosError<{ redirectUrl?: string }>(error)) {
          const redirectUrl = error.response?.data?.redirectUrl

          if (redirectUrl) {
            router.replace(redirectUrl)
            return
          }
        }

        router.replace(ERoutes.MAIN_PAGE)
      }
    }

    void join()
  }, [inviteCode, isLoaded, joinByInvite, router, userId])

  if (!isLoaded || isPending) {
    return <Spinner />
  }

  if (isError) {
    return <ErrorComponent />
  }

  return null
}

export default InvitePage
