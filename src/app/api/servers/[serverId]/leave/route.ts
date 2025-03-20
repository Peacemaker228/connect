import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { db } from '@/lib/shared/utils/db'

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
        profileId: {
          not: profile.id,
        },
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      data: {
        members: {
          deleteMany: {
            profileId: profile.id,
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Server_ID_LEAVE]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}
