import { NextApiRequest } from 'next'

import {
  createChannelDeletedRealtimeEvent,
  createChannelUpdatedRealtimeEvent,
} from '@app-core/contracts/server-slice-realtime'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'
import { emitServerSliceRealtimeEvent } from '../utils/server-slice-realtime'
import { NextApiResponseServerIo } from '@/types'

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
      const response = await requestBackendApi({
        path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId as string)}`,
        method: 'PATCH',
        body: req.body,
        headers: {
          'x-profile-id': profile.id,
        },
      })
      const parsedResponse = await readBackendApiResponse(response)

      if (parsedResponse.status === 200) {
        const body = req.body as { name?: string; type?: string }

        emitServerSliceRealtimeEvent(
          res,
          createChannelUpdatedRealtimeEvent(String(serverId), {
            id: channelId,
            name: body.name,
            type: body.type,
          }),
        )
      }

      return writePagesProxyResponse(res, parsedResponse)
    }

    const response = await requestBackendApi({
      path: `/api/channels/${channelId}?serverId=${encodeURIComponent(serverId as string)}`,
      method: 'DELETE',
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status === 200) {
      emitServerSliceRealtimeEvent(res, createChannelDeletedRealtimeEvent(String(serverId), channelId))
    }

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.error(`[CHANNEL_${method}]`, err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
