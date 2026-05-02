import type { ServerMembersProfilesDto } from '@app-core/contracts'
import type { BackendAuthHeaders } from '@/lib/shared/utils/backend-auth-context'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'

export type ServerRouteGuardAuth = {
  headers: BackendAuthHeaders
  profileId: string
}

export type ServerRouteGuardResult =
  | {
      status: 'ok'
      server: ServerMembersProfilesDto
    }
  | {
      status: 'unauthorized'
    }
  | {
      status: 'not-found'
    }

export const getServerRouteGuardAuth = async (): Promise<ServerRouteGuardAuth | null> => {
  const headers = await currentBackendAuthHeaders()
  const profileId = headers?.['x-profile-id']

  if (!headers || !profileId) {
    return null
  }

  return {
    headers,
    profileId,
  }
}

export const getServerRouteGuardServer = async (
  serverId: string,
  authHeaders: BackendAuthHeaders,
): Promise<ServerRouteGuardResult> => {
  const response = await requestBackendApi({
    path: `/api/servers/${serverId}`,
    headers: authHeaders,
  })

  if (response.status === 401) {
    return { status: 'unauthorized' }
  }

  if (response.status === 404) {
    return { status: 'not-found' }
  }

  if (!response.ok) {
    throw new Error(`Failed to get server route guard snapshot: ${response.status}`)
  }

  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected server route guard response status: ${parsedResponse.status}`)
  }

  return {
    status: 'ok',
    server: parsedResponse.data as ServerMembersProfilesDto,
  }
}
