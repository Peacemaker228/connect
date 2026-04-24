import { NextApiRequest } from 'next'

import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'
import { NextApiResponseServerIo } from '@/types'

const getProfileAndServerId = async (req: NextApiRequest) => {
  const profile = await currentProfilePages(req)
  if (!profile) throw new Error('Unauthorized')

  const { serverId } = req.query
  if (!serverId) throw new Error('Server ID Missing')

  return { profile, serverId }
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  try {
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
      const response = await requestBackendApi({
        path: `/api/members/${memberId}?serverId=${encodeURIComponent(serverId as string)}`,
        method: 'DELETE',
        headers: {
          'x-profile-id': profile.id,
        },
      })
      const parsedResponse = await readBackendApiResponse(response)

      if (parsedResponse.status === 200 && res.socket.server.io) {
        res.socket.server.io.emit(`server:${serverId}:members`, {
          action: 'member_deleted',
          memberId: memberId as string,
        })
      }

      if (parsedResponse.isJson) {
        return res.status(parsedResponse.status).json(parsedResponse.data)
      }

      return res.status(parsedResponse.status).send(parsedResponse.data)
    }

    const { role } = req.body
    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    const response = await requestBackendApi({
      path: `/api/members/${memberId}?serverId=${encodeURIComponent(serverId as string)}`,
      method: 'PATCH',
      body: {
        role,
      },
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status === 200 && res.socket.server.io) {
      res.socket.server.io.emit(`server:${serverId}:members`, {
        action: 'member_role_updated',
        memberId: memberId as string,
      })
    }

    if (parsedResponse.isJson) {
      return res.status(parsedResponse.status).json(parsedResponse.data)
    }

    return res.status(parsedResponse.status).send(parsedResponse.data)
  } catch (err) {
    console.error('[MEMBER_REQUEST_HANDLER]', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
