import { NextRequest, NextResponse } from 'next/server'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room')
  const username = req.nextUrl.searchParams.get('username')

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 })
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 })
  }

  const searchParams = new URLSearchParams({
    room,
    username,
  })

  const response = await requestBackendApi({
    path: `/api/media/livekit-token?${searchParams.toString()}`,
  })

  return toNextProxyResponse(response)
}
