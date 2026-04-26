import { NextResponse } from 'next/server'

import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export async function POST(req: Request) {
  try {
    const response = await requestBackendApi({
      path: '/api/auth/session/logout',
      method: 'POST',
      headers: {
        cookie: req.headers.get('cookie') ?? undefined,
      },
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('[AUTH_SESSION_LOGOUT]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
