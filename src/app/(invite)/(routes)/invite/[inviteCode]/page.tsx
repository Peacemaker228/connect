'use client'

import { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { useJoinByInvite } from '@/lib/shared/data-access/server/api-socket'
import { ERoutes } from '@/lib/shared/utils/routes'

const InvitePage = () => {
  const router = useRouter()
  const { inviteCode } = useParams() as { inviteCode?: string }

  const hasJoinedRef = useRef(false)

  const { mutateAsync: joinByInvite, isError, isPending } = useJoinByInvite()

  useEffect(() => {
    if (!inviteCode || hasJoinedRef.current) return

    // TODO: без рефа запрос отсылается дважды даже в prod (bun run start) (интересно почему)
    hasJoinedRef.current = true

    const join = async () => {
      try {
        const { redirectUrl } = await joinByInvite(inviteCode)
        router.push(redirectUrl)
      } catch (err) {
        console.error('Invite failed:', err)
        router.push(ERoutes.MAIN_PAGE)
      }
    }

    void join()
  }, [inviteCode, joinByInvite, router])

  if (isPending) return <Spinner />
  if (isError) return <ErrorComponent />
  return null
}

export default InvitePage
