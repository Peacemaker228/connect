import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/current-profile'
import { v4 as uuidV4 } from 'uuid'
import { db } from '@/lib/db'
import { MemberRole } from '@prisma/client'
import { EGeneral } from '@/types'

export const POST = async (req: Request) => {
  try {
    const { name, imageUrl } = await req.json()

    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const server = await db.server.create({
      data: {
        profileId: profile.id,
        name,
        imageUrl,
        inviteCode: uuidV4(),
        channels: {
          create: [
            {
              name: EGeneral.GENERAL,
              profileId: profile.id,
              type: 'TEXT',
            },
          ],
        },
        members: {
          create: [
            {
              profileId: profile.id,
              role: MemberRole.ADMIN,
            },
          ],
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[SERVERS_POST]', err)

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
