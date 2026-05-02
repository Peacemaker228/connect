import { FC } from 'react'
import { redirect } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { EGeneral } from '@/types'
import { getServerRouteGuardAuth, getServerRouteGuardServer } from '@/lib/shared/utils/server-route-guard'

interface IServerIdPageProps {
  params: Promise<{ serverId: string }>
}

const ServerIdPage: FC<IServerIdPageProps> = async ({ params }) => {
  const auth = await getServerRouteGuardAuth()

  if (!auth) {
    return redirect(ERoutes.SIGN_IN)
  }

  const { serverId } = await params

  const serverResult = await getServerRouteGuardServer(serverId, auth.headers)

  if (serverResult.status === 'unauthorized') {
    return redirect(ERoutes.SIGN_IN)
  }

  if (serverResult.status !== 'ok') {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const { server } = serverResult
  const initialChannel = server.channels.find((channel) => channel.name === EGeneral.GENERAL)

  if (!initialChannel || initialChannel?.name !== EGeneral.GENERAL) {
    return redirect(ERoutes.MAIN_PAGE)
  }

  return redirect(`${ERoutes.SERVERS}/${serverId}${ERoutes.CHANNELS}/${initialChannel.id}`)
}

export default ServerIdPage
