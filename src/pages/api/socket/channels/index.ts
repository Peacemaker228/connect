import { db } from '@/lib/shared/utils/db'
import { MemberRole } from '@prisma/client'
import { EGeneral, NextApiResponseServerIo } from '@/types'
import { NextApiRequest } from 'next'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, type } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    if (!type) {
      return res.status(400).json({ error: 'Type is required' })
    }

    const profile = await currentProfilePages(req)
    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { serverId } = req.query
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    if (name === EGeneral.GENERAL) {
      return res.status(400).json({ error: 'Name cannot be "general"' })
    }

    const server = await db.server.update({
      where: {
        id: serverId as string,
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

    if (res.socket.server.io) {
      const io = res.socket.server.io

      const channelKey = `server:${serverId}:channels`
      io.emit(channelKey, {
        action: 'channel_created',
        channel: { name, type },
      })
    } else {
      console.error('Socket.IO not initialized on the server')
    }

    return res.status(200).json(server)
  } catch (err) {
    console.error('[CHANNEL_POST]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
