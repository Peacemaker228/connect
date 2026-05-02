import { FC } from 'react'
import { InvitePageClient } from './invite-page-client'
import { validateInviteCode } from '@/lib/shared/utils/invite-validation'

interface IInvitePageProps {
  params: Promise<{ inviteCode: string }>
  searchParams: Promise<{ mode?: string }>
}

const InvitePage: FC<IInvitePageProps> = async ({ params, searchParams }) => {
  const { inviteCode } = await params
  const { mode } = await searchParams

  const isValidInvite = await validateInviteCode(inviteCode)

  return (
    <InvitePageClient
      inviteCode={inviteCode}
      isValidInvite={isValidInvite}
      shouldAutoJoinInBrowser={mode === 'browser'}
    />
  )
}

export default InvitePage
