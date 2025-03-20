import { currentProfile } from '@/lib/shared/utils/current-profile'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Profile not found', { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.log('[USER_GET]', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
