import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/current-profile'
import { db } from '@/lib/db'
import { v4 as uuidV4 } from 'uuid'

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

    const server = await db.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        inviteCode: uuidV4(),
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Server_ID_PATCH]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}
