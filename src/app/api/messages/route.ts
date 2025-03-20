import { NextResponse } from 'next/server'
import { currentProfile } from '@/lib/shared/utils/current-profile'
import { Message } from '@prisma/client'
import { db } from '@/lib/shared/utils/db'

const MESSAGE_BATCH_SIZE = 10

export async function GET(req: Request) {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    const cursor = searchParams.get('cursor')
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return new NextResponse('Channel ID Missing', { status: 400 })
    }

    let messages: Message[]

    if (cursor) {
      messages = await db.message.findMany({
        take: MESSAGE_BATCH_SIZE,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      messages = await db.message.findMany({
        take: MESSAGE_BATCH_SIZE,
        where: {
          channelId,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    let nextCursor = null

    if (messages.length === MESSAGE_BATCH_SIZE) {
      nextCursor = messages[MESSAGE_BATCH_SIZE - 1].id
    }

    return NextResponse.json({ items: messages, nextCursor })
  } catch (err) {
    console.log('[MESSAGE_GET]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
