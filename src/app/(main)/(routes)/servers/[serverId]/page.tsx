import { FC } from 'react'
import { redirect } from 'next/navigation'
import { ERoutes } from '@/lib/shared/utils/routes'
import { db } from '@/lib/shared/utils/db'
import { EGeneral } from '@/types'
import { currentProfile } from '@/lib/shared/utils/current-profile'

interface IServerIdPageProps {
  params: Promise<{ serverId: string }>
}

const ServerIdPage: FC<IServerIdPageProps> = async ({ params }) => {
  const profile = await currentProfile()

  if (!profile) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { serverId } = await params

  const server = await db.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channels: {
        where: {
          name: EGeneral.GENERAL,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!server) {
    return null
  }

  const initialChannel = server?.channels[0]

  if (!initialChannel || initialChannel?.name !== EGeneral.GENERAL) {
    return null
  }

  return redirect(`${ERoutes.SERVERS}/${serverId}${ERoutes.CHANNELS}/${initialChannel.id}`)
}

export default ServerIdPage
