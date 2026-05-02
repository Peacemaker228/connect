import { initialProfile } from '@/lib/shared/utils/initial-profile'
import { redirect } from 'next/navigation'
import { InitialModal } from '@/lib/shared/features/modals/initial-modal'
import { ERoutes } from '@app-core/routing/routes'
import type { BackendAuthHeaders } from '@/lib/shared/utils/backend-auth-context'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'
import type { ServerListItemDto } from '@app-core/contracts'

const getSetupServers = async (authHeaders: BackendAuthHeaders) => {
  const response = await requestBackendApi({
    path: '/api/servers',
    headers: authHeaders,
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to get setup servers: ${response.status}`)
  }

  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected setup servers response status: ${parsedResponse.status}`)
  }

  return parsedResponse.data as ServerListItemDto[]
}

const SetupPage = async () => {
  const profile = await initialProfile()

  if (!profile) {
    redirect(ERoutes.SIGN_IN)
  }

  const authHeaders = await currentBackendAuthHeaders()

  if (!authHeaders) {
    redirect(ERoutes.SIGN_IN)
  }

  const servers = await getSetupServers(authHeaders)

  if (!servers) {
    redirect(ERoutes.SIGN_IN)
  }

  const server = servers[0]

  if (server) {
    return redirect(`/servers/${server.id}`)
  }

  return <InitialModal />
}

export default SetupPage
