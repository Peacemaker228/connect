import React, { FC, PropsWithChildren } from 'react'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { db } from '@/lib/shared/utils/db'
import { redirect } from 'next/navigation'
import { ERoutes } from '@/lib/shared/utils/routes'
import { ServerSidebar } from '@/lib/server-list/features'

interface IServerIdLayoutProps {
  params: Promise<{ serverId: string }>
}

const ServerIdLayout: FC<PropsWithChildren<IServerIdLayoutProps>> = async ({ children, params }) => {
  const { serverId } = await params
  const profile = await currentProfile()

  if (!profile) {
    return redirect(ERoutes.SIGN_IN)
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  })

  if (!server) return redirect(ERoutes.MAIN_PAGE)

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId={serverId} />
      </div>
      <main className="pt-1 h-full md:pl-60">{children}</main>
    </div>
  )
}

export default ServerIdLayout
