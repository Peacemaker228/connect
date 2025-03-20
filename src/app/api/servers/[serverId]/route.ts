import { currentProfile } from '@/lib/shared/utils/current-profile'
import { NextResponse } from 'next/server'
import { db } from '@/lib/shared/utils/db'

export const DELETE = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serverId } = await params

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const server = await db.server.delete({
      where: {
        id: serverId,
        profileId: profile.id,
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Server_ID_DELETE]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const PATCH = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serverId } = await params

    if (!serverId) {
      return new NextResponse('Server ID Missing', { status: 400 })
    }

    const { name, imageUrl } = await req.json()

    const server = await db.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        name,
        imageUrl,
      },
    })

    return NextResponse.json(server)
  } catch (err) {
    console.log('[Server_ID_PATCH]', err)

    return new NextResponse('Internal Error', { status: 500 })
  }
}

export const GET = async (req: Request, { params }: { params: Promise<{ serverId: string }> }) => {
  try {
    const profile = await currentProfile()
    if (!profile) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { serverId } = await params
    if (!serverId) {
      return new Response('Server ID Missing', { status: 400 })
    }

    const server = await db.server.findUnique({
      where: {
        id: serverId,
      },
      include: {
        channels: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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

    if (!server) {
      return new Response('Server not found', { status: 404 })
    }

    return NextResponse.json(server)
  } catch (err) {
    console.log('[SERVER_GET]', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
