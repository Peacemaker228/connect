import { NextApiRequest } from 'next'

import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'
import { EGeneral, NextApiResponseServerIo } from '@/types'

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

      const response = await requestBackendApi({
        path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId as string)}`,
        method: 'PATCH',
        body: req.body,
        headers: {
          'x-profile-id': profile.id,
        },
      })
      const parsedResponse = await readBackendApiResponse(response)

      if (parsedResponse.status === 200 && res.socket.server.io) {
        res.socket.server.io.emit(`server:${serverId}:channels`, {
          action: 'channel_updated',
          channel: { id: channelId, name, type },
        })
      }

      if (parsedResponse.isJson) {
        return res.status(parsedResponse.status).json(parsedResponse.data)
      }

      return res.status(parsedResponse.status).send(parsedResponse.data)
    }

    const response = await requestBackendApi({
      path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId as string)}`,
      method: 'DELETE',
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status === 200 && res.socket.server.io) {
      res.socket.server.io.emit(`server:${serverId}:channels`, {
        action: 'channel_deleted',
        channelId,
      })
    }

    if (parsedResponse.isJson) {
      return res.status(parsedResponse.status).json(parsedResponse.data)
    }

    return res.status(parsedResponse.status).send(parsedResponse.data)
  } catch (err) {
    console.error(`[CHANNEL_${method}]`, err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
