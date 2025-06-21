import { NextApiRequest } from 'next'
import { db } from '@/lib/shared/utils/db'
import { ERoutes } from '@/lib/shared/utils/routes'
import { NextApiResponseServerIo } from '@/types'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { inviteCode } = req.body

  if (!inviteCode) {
    return res.status(400).json({ redirectUrl: ERoutes.MAIN_PAGE })
  }

  const profile = await currentProfilePages(req)

  if (!profile) {
    return res.status(401).json({ redirectUrl: ERoutes.SIGN_IN })
  }

  try {
    const server = await db.server.update({
      where: {
        inviteCode,
      },
      data: {
        members: {
          create: {
            profileId: profile.id,
          },
        },
      },
    })

    if (res.socket.server.io) {
      const io = res.socket.server.io

      io.emit(`server:${server.id}:members`, {
        action: 'member_added',
        serverId: server.id,
      })
    } else {
      console.error('Socket.IO not initialized')
    }

    return res.status(200).json({ redirectUrl: `${ERoutes.SERVERS}/${server.id}` })
  } catch (error) {
    // Обработка ошибки уникального ограничения (prisma @@uniq)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Участник уже существует — ищем сервер и перенаправляем на него
      const existingServer = await db.server.findFirst({
        where: {
          inviteCode,
          members: {
            some: {
              profileId: profile.id,
            },
          },
        },
      })

      if (existingServer) {
        return res.status(200).json({ redirectUrl: `${ERoutes.SERVERS}/${existingServer.id}` })
      }

      return res.status(400).json({ redirectUrl: ERoutes.MAIN_PAGE })
    }

    console.error('Invite failed:', error)
    return res.status(500).json({ redirectUrl: ERoutes.MAIN_PAGE })
  }
}
