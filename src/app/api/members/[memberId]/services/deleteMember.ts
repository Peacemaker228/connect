import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/current-profile'
import { db } from '@/lib/db'
import { validateMemberId } from './utils'
import { getServerId } from '@/app/api/utils'

export const deleteMember = async (req: Request, params: Promise<{ memberId: string }>) => {
  try {
    const profile = await currentProfile()
    if (!profile) return new NextResponse('Unauthorized', { status: 401 })

    const serverId = getServerId(req.url)
    if (!serverId) return new NextResponse('Server ID Missing', { status: 400 })

    const memberId = await validateMemberId(params)
    if (!memberId) return new NextResponse('Member ID Missing', { status: 400 })

    const server = await db.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            profileId: {
              not: profile.id,
            },
          },
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.error('[MEMBER_ID_DELETE]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
