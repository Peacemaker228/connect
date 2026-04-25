import { NextResponse } from 'next/server'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const PATCH = async (_req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serverId } = await params

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/servers/${serverId}/invite-code`,
      method: 'PATCH',
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Server_ID_PATCH]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}
