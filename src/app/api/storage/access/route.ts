import { NextResponse } from 'next/server'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const requestUrl = new URL(req.url)
    const search = requestUrl.searchParams.toString()
    const path = search ? `/api/storage/access?${search}` : '/api/storage/access'
    const response = await requestBackendApi({
      path,
      method: 'GET',
      redirect: 'manual',
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('storage access error', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
