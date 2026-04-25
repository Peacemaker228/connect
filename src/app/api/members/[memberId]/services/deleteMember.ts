import { NextResponse } from 'next/server'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'
import { validateMemberId } from './utils'
import { getServerId } from '@/app/api/utils'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const deleteMember = async (req: Request, params: Promise<{ memberId: string }>) => {
  try {
    const authHeaders = await currentBackendAuthHeaders()
    if (!authHeaders) return new NextResponse('Unauthorized', { status: 401 })

    const serverId = getServerId(req.url)
    if (!serverId) return new NextResponse('Server ID Missing', { status: 400 })

    const memberId = await validateMemberId(params)
    if (!memberId) return new NextResponse('Member ID Missing', { status: 400 })

    const response = await requestBackendApi({
      path: `/api/members/${memberId}?serverId=${encodeURIComponent(serverId)}`,
      method: 'DELETE',
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.error('[MEMBER_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
