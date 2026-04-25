import { NextResponse } from 'next/server'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const PATCH = async (req: Request, { params }: { params: Promise<{ channelId: string }> }) => {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const serverId = new URL(req.url).searchParams.get('serverId')

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const { channelId } = await params

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId)}`,
      method: 'PATCH',
      body: await req.json(),
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Channel_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const DELETE = async (req: Request, { params }: { params: Promise<{ channelId: string }> }) => {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const serverId = new URL(req.url).searchParams.get('serverId')

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const { channelId } = await params

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId)}`,
      method: 'DELETE',
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Channel_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
