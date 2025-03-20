import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { getServerId } from '@/app/api/utils'
import { db } from '@/lib/shared/utils/db'
import { MemberRole } from '@prisma/client'
import { EGeneral } from '@/types'

export const POST = async (req: Request) => {
  try {
    const { name, type } = await req.json()
    if (!name) {
      return new Response('Name is required', { status: 400 })
    }
    if (!type) {
      return new Response('Type is required', { status: 400 })
    }

    const profile = await currentProfile()
    if (!profile) {
      return new Response('Unauthorized', { status: 401 })
    }

    const serverId = getServerId(req.url)
    if (!serverId) {
      return new Response('Server ID Missing', { status: 400 })
    }

    if (name === EGeneral.GENERAL) {
      return new Response('Name cannot be "general"', { status: 400 })
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
          create: {
            profileId: profile.id,
            name,
            type,
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[CHANNEL_POST]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
