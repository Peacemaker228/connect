import { NextApiRequest } from 'next'

import { createChannelCreatedRealtimeEvent } from '@app-core/contracts/server-slice-realtime'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'
import { emitServerSliceRealtimeEvent } from '../utils/server-slice-realtime'
import { NextApiResponseServerIo } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
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

    const response = await requestBackendApi({
      path: `/api/channels?serverId=${encodeURIComponent(serverId as string)}`,
      method: 'POST',
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
        createChannelCreatedRealtimeEvent(String(serverId), {
          name: body.name,
          type: body.type,
        }),
      )
    }

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.error('[CHANNEL_POST]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
