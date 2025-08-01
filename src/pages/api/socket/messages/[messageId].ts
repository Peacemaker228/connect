import { NextApiRequest } from 'next'
import { NextApiResponseServerIo } from '@/types'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { db } from '@/lib/shared/utils/db'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'DELETE' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const profile = await currentProfilePages(req)

    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { messageId, serverId, channelId } = req.query

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID Missing' })
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    })

    if (!server) {
      return res.status(404).json({ error: 'Server Not Found' })
    }

    const { content } = req.body

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    })

    if (!channel) {
      return res.status(404).json({ error: 'Channel Not Found' })
    }

    const member = server.members.find((member) => member.profileId === profile.id)

    if (!member) {
      return res.status(404).json({ error: 'Member Not Found' })
    }

    let message = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!message || message.deleted) {
      return res.status(404).json({ error: 'Message Not Found' })
    }

    const isMessageOwner = message.memberId === member.id
    const isAdmin = member.role === 'ADMIN'
    const isModerator = member.role === 'MODERATOR'
    const canModify = isMessageOwner || isAdmin || isModerator

    if (!canModify) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'DELETE') {
      message = await db.message.update({
        where: {
          id: messageId as string,
        },
        data: {
          fileUrl: null,
          content: 'This message has been deleted.',
          deleted: true,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      })
    }

    if (req.method === 'PATCH') {
      if (!isMessageOwner) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!content) {
        return res.status(400).json({ error: 'Content Missing' })
      }

      message = await db.message.update({
        where: {
          id: messageId as string,
        },
        data: {
          content,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      })
    }

    const updateKey = `chat:${channelId}:messages:update`

    res?.socket?.server?.io?.emit(updateKey, message)

    return res.status(200).json(message)
  } catch (err) {
    console.log('[message_Id]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
