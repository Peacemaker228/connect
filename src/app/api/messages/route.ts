import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export async function GET(req: Request) {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const cursor = searchParams.get('cursor')
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    const search = new URLSearchParams()
    search.set('channelId', channelId)
    if (cursor) {
      search.set('cursor', cursor)
    }

    const response = await requestBackendApi({
      path: `/api/messages?${search.toString()}`,
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[MESSAGE_GET]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
