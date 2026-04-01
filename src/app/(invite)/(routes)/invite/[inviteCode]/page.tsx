import { FC } from 'react'
import { db } from '@/lib/shared/utils/db'
import { InvitePageClient } from './invite-page-client'

interface IInvitePageProps {
  params: Promise<{ inviteCode: string }>
  searchParams: Promise<{ mode?: string }>
}

const InvitePage: FC<IInvitePageProps> = async ({ params, searchParams }) => {
  const { inviteCode } = await params
  const { mode } = await searchParams

  const server = await db.server.findUnique({
    where: {
      inviteCode,
    },
    select: {
      id: true,
    },
  })

  return (
    <InvitePageClient
      inviteCode={inviteCode}
      isValidInvite={Boolean(server)}
      shouldAutoJoinInBrowser={mode === 'browser'}
    />
  )
}

export default InvitePage
