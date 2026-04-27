import { NextResponse } from 'next/server'
import { requestBackendApi, toNextProxyResponse } from '@/lib/shared/utils/backend-api'
import { currentBackendAuthHeaders } from '@/lib/shared/utils/current-profile'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()

    const response = await requestBackendApi({
      path: '/api/storage/upload',
      method: 'POST',
      body: formData,
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('server-upload error', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeaders = await currentBackendAuthHeaders()

    if (!authHeaders) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const response = await requestBackendApi({
      path: '/api/storage/file',
      method: 'DELETE',
      body,
      headers: authHeaders,
    })

    return toNextProxyResponse(response)
  } catch (error) {
    console.error('server-upload delete error', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
