import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

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
      path: `/api/servers/${serverId}/leave`,
      method: 'PATCH',
      headers: {
        'x-profile-id': profile.id,
      },
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[Server_ID_LEAVE]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}
