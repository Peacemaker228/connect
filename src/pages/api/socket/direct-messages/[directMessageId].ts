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

    const { directMessageId, conversationId } = req.query

    if (!directMessageId) {
      return res.status(400).json({ error: 'Direct Message ID Missing' })
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID Missing' })
    }

    const { content } = req.body

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            },
          },
          {
            memberTwo: {
              profileId: profile.id,
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          },
        },
        memberTwo: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation Not Found' })
    }

    const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo

    if (!member) {
      return res.status(404).json({ error: 'Member Not Found' })
    }

    let directMessage = await db.directMessage.findFirst({
      where: {
        id: directMessageId as string,
        conversationId: conversationId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!directMessage || directMessage.deleted) {
      return res.status(404).json({ error: 'Message Not Found' })
    }

    const isMessageOwner = directMessage.memberId === member.id
    const isAdmin = member.role === 'ADMIN'
    const isModerator = member.role === 'MODERATOR'
    const canModify = isMessageOwner || isAdmin || isModerator

    if (!canModify) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'DELETE') {
      directMessage = await db.directMessage.update({
        where: {
          id: directMessageId as string,
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

      directMessage = await db.directMessage.update({
        where: {
          id: directMessageId as string,
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

    const updateKey = `chat:${conversation.id}:messages:update`

    res?.socket?.server?.io?.emit(updateKey, directMessage)

    return res.status(200).json(directMessage)
  } catch (err) {
    console.log('[message_Id]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
