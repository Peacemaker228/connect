import { NextApiRequest } from 'next'

import { createMemberLeftRealtimeEvent } from '@app-core/contracts/server-slice-realtime'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'
import { emitServerSliceRealtimeEvent } from '../../utils/server-slice-realtime'
import { NextApiResponseServerIo } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const profile = await currentProfilePages(req)
    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { serverId } = req.query
    if (!serverId || typeof serverId !== 'string') {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    const response = await requestBackendApi({
      path: `/api/servers/${serverId}/leave`,
      method: 'PATCH',
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status === 200) {
      emitServerSliceRealtimeEvent(res, createMemberLeftRealtimeEvent(serverId, profile.id))
    }

    return writePagesProxyResponse(res, parsedResponse)
  } catch (error) {
    console.error('[SERVER_LEAVE_ERROR]', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
