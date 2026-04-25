import { NextResponse } from 'next/server'

import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'

export const POST = async (req: Request) => {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const response = await requestBackendApi({
      path: '/api/servers',
      method: 'POST',
      body: await req.json(),
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[SERVERS_POST]', err)

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export const GET = async () => {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const response = await requestBackendApi({
      path: '/api/servers',
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (err) {
    console.log('[SERVERS_GET]', err)

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
