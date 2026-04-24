import { currentProfile } from '@/lib/shared/utils/current-profile'
import { NextResponse } from 'next/server'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const DELETE = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serverId } = await params

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/servers/${serverId}`,
      method: 'DELETE',
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Server_ID_DELETE]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const PATCH = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serverId } = await params

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/servers/${serverId}`,
      method: 'PATCH',
      body: await req.json(),
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Server_ID_PATCH]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const GET = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()
    if (!profile) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { serverId } = await params
    if (!serverId) {
      return new Response('Server ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/servers/${serverId}`,
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[SERVER_GET]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
