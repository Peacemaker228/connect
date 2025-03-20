'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { useJoinByInvite } from '@/lib/shared/data-access/server/api-socket'
import { ERoutes } from '@/lib/shared/utils/routes'

const InvitePage = () => {
  const router = useRouter()
  const params = useParams()
  const inviteCode = params?.inviteCode

  const { mutate: handleInvite, isError, isPending } = useJoinByInvite()

  useEffect(() => {
    handleInvite(inviteCode as string, {
      onSuccess: ({ redirectUrl }) => {
        router.push(redirectUrl)
      },
      onError: () => {
        router.push(ERoutes.MAIN_PAGE)
      },
    })
  }, [handleInvite, inviteCode, router])

  if (isPending) {
    return <Spinner />
  }

  if (isError) {
    return <ErrorComponent />
  }

  return null
}

export default InvitePage
