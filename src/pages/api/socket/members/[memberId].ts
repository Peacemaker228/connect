import { NextApiRequest } from 'next'
import { db } from '@/lib/shared/utils/db'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { NextApiResponseServerIo } from '@/types'

interface ISocketNotification {
  res: NextApiResponseServerIo
  serverId?: string
  action: string
  memberId: string
  isCommonUpdate?: boolean
}

const getProfileAndServerId = async (req: NextApiRequest) => {
  const profile = await currentProfilePages(req)
  if (!profile) throw new Error('Unauthorized')

  const { serverId } = req.query
  if (!serverId) throw new Error('Server ID Missing')

  return { profile, serverId }
}
const updateServerMembers = async ({
  serverId,
  profileId,
  data,
}: {
  serverId: string
  profileId: string
  // TODO: попробовать убрать any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}) => {
  return db.server.update({
    where: {
      id: serverId,
      profileId: profileId,
    },
    data: {
      members: data,
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
}

const sendSocketNotification = ({ res, serverId, action, memberId, isCommonUpdate }: ISocketNotification) => {
  if (res.socket.server.io) {
    const io = res.socket.server.io

    const channelKey = `server:${serverId}:members`
    const channelKeyCommon = `server:members`

    const key = isCommonUpdate ? channelKeyCommon : channelKey

    const args: { action: string; memberId: string; serverId?: string } = {
      action: action,
      memberId: memberId,
    }

    if (isCommonUpdate) {
      args.serverId = serverId
    }

    console.log(key, args, 'keyArgs')

    io.emit(key, args)
  } else {
    console.error('Socket.IO not initialized on the server')
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  try {
    // Валидация метода
    if (req.method !== 'DELETE' && req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { profile, serverId } = await getProfileAndServerId(req)

    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    const { memberId } = req.query

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID Missing' })
    }

    if (req.method === 'DELETE') {
      // DELETE logic: Remove member
      const server = await updateServerMembers({
        serverId: serverId as string,
        profileId: profile.id,
        data: {
          deleteMany: {
            id: memberId,
            profileId: {
              not: profile.id,
            },
          },
        },
      })

      if (res.socket.server.io) {
        const io = res.socket.server.io
        // TODO: баг в паре с хуком по пути: src/lib/shared/data-access/server-list-sidebar/use-servers-socket.ts
        // TODO: проблема с сокетами: вызывается только первый emit
        // io.emit('server:members', {
        //   action: 'member_deleted',
        //   memberId: memberId as string,
        //   serverId: serverId as string,
        // })
        io.emit(`server:${serverId}:members`, {
          action: 'member_deleted',
          memberId: memberId as string,
        })
      }

      return res.status(200).json(server)
    }

    if (req.method === 'PATCH') {
      // PATCH logic: Update member role
      const { role } = req.body
      if (!role) {
        return res.status(400).json({ error: 'Role is required' })
      }

      const server = await updateServerMembers({
        serverId: serverId as string,
        profileId: profile.id,
        data: {
          update: {
            where: {
              id: memberId,
              profileId: {
                not: profile.id,
              },
            },
            data: { role },
          },
        },
      })

      sendSocketNotification({
        res,
        serverId: serverId as string,
        action: 'member_role_updated',
        memberId: memberId as string,
      })

      return res.status(200).json(server)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[MEMBER_REQUEST_HANDLER]', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
