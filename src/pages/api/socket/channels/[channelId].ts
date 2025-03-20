import { db } from '@/lib/shared/utils/db'
import { MemberRole } from '@prisma/client'
import { EGeneral, NextApiResponseServerIo } from '@/types'
import { NextApiRequest } from 'next'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  const { method } = req

  if (!['PATCH', 'DELETE'].includes(method || '')) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const profile = await currentProfilePages(req)
    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { serverId } = req.query
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    const { channelId } = req.query
    if (!channelId || typeof channelId !== 'string') {
      return res.status(400).json({ error: 'Channel ID Missing or Invalid' })
    }

    if (method === 'PATCH') {
      const { name, type } = req.body

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and Type are required' })
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
            update: {
              where: {
                id: channelId,
                NOT: { name: EGeneral.GENERAL },
              },
              data: { name, type },
            },
          },
        },
      })

      if (res.socket.server.io) {
        const io = res.socket.server.io

        const channelKey = `server:${serverId}:channels`

        io.emit(channelKey, {
          action: 'channel_updated',
          channel: { id: channelId, name, type },
        })
      }

      return res.status(200).json(server)
    }

    if (method === 'DELETE') {
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
            delete: {
              id: channelId,
              name: { not: EGeneral.GENERAL },
            },
          },
        },
      })

      if (res.socket.server.io) {
        const io = res.socket.server.io

        const channelKey = `server:${serverId}:channels`

        io.emit(channelKey, {
          action: 'channel_deleted',
          channelId,
        })
      }

      return res.status(200).json(server)
    }
  } catch (err) {
    console.error(`[CHANNEL_${method}]`, err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
