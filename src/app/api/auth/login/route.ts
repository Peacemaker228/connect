import { NextResponse } from 'next/server'

import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => undefined)
    const response = await requestBackendApi({
      path: '/api/auth/login/password',
      method: 'POST',
      body,
      headers: {
        cookie: req.headers.get('cookie') ?? undefined,
      },
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('[AUTH_LOGIN_ROUTE]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
