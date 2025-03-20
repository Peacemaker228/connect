import { NextApiRequest } from 'next'
import { db } from '@/lib/shared/utils/db'
import { NextApiResponseServerIo } from '@/types'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const profile = await currentProfilePages(req)
    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { serverId } = req.query
    if (!serverId || typeof serverId !== 'string') {
      return res.status(400).json({ error: 'Server ID Missing' })
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

    if (res.socket.server.io) {
      const io = res.socket.server.io
      const memberKey = `server:${serverId}:members`
      io.emit(memberKey, {
        action: 'member_left',
        memberId: profile.id,
      })
    }

    res.status(200).json(server)
  } catch (error) {
    console.error('[SERVER_LEAVE_ERROR]', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
