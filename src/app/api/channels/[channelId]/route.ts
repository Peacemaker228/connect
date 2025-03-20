import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { db } from '@/lib/shared/utils/db'
import { EGeneral } from '@/types'
import { MemberRole } from '@prisma/client'

export const PATCH = async (req: Request, { params }: { params: Promise<{ channelId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, type } = await req.json()

    if (name === EGeneral.GENERAL) {
      return new NextResponse('Name cannot be "general"', { status: 400 })
    }

    const serverId = new URL(req.url).searchParams.get('serverId')

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const { channelId } = await params

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
              NOT: {
                name: EGeneral.GENERAL,
              },
            },
            data: {
              name,
              type,
            },
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Channel_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const DELETE = async (req: Request, { params }: { params: Promise<{ channelId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const serverId = new URL(req.url).searchParams.get('serverId')

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const { channelId } = await params

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          delete: {
            id: channelId,
            name: {
              not: EGeneral.GENERAL,
            },
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Channel_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
