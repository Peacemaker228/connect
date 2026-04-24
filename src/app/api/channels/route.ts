import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { getServerId } from '@/app/api/utils'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const POST = async (req: Request) => {
  try {
    const profile = await currentProfile()
    if (!profile) {
      return new Response('Unauthorized', { status: 401 })
    }

    const serverId = getServerId(req.url)
    if (!serverId) {
      return new Response('Server ID Missing', { status: 400 })
    }

    const response = await requestBackendApi({
      path: `/api/channels?serverId=${encodeURIComponent(serverId)}`,
      method: 'POST',
      body: await req.json(),
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[CHANNEL_POST]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
