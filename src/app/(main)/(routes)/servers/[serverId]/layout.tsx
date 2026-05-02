import React, { FC, PropsWithChildren } from 'react'
import { redirect } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { ServerSidebar } from '@/lib/server-list/features'
import { getServerRouteGuardAuth, getServerRouteGuardServer } from '@/lib/shared/utils/server-route-guard'

interface IServerIdLayoutProps {
  params: Promise<{ serverId: string }>
}

const ServerIdLayout: FC<PropsWithChildren<IServerIdLayoutProps>> = async ({ children, params }) => {
  const { serverId } = await params
  const auth = await getServerRouteGuardAuth()

  if (!auth) {
    return redirect(ERoutes.SIGN_IN)
  }

  const serverResult = await getServerRouteGuardServer(serverId, auth.headers)

  if (serverResult.status === 'unauthorized') {
    return redirect(ERoutes.SIGN_IN)
  }

  if (serverResult.status !== 'ok') return redirect(ERoutes.MAIN_PAGE)

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId={serverId} />
      </div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  )
}

export default ServerIdLayout
