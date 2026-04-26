import { NextResponse } from 'next/server'

import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'
import { createBackendAuthHeaders } from '@/lib/shared/utils/backend-auth-context'
import { currentBackendAuthSession } from '@/lib/shared/utils/current-profile'

export async function POST(req: Request) {
  try {
    const currentSession = await currentBackendAuthSession()

    if (!currentSession?.profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (currentSession.strategy === 'access-token') {
      return NextResponse.json(currentSession)
    }

    const authHeaders = createBackendAuthHeaders(currentSession)

    if (!authHeaders) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const response = await requestBackendApi({
      path: '/api/auth/session/exchange',
      method: 'POST',
      headers: {
        ...authHeaders,
        cookie: req.headers.get('cookie') ?? undefined,
      },
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('[AUTH_SESSION_BOOTSTRAP]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
