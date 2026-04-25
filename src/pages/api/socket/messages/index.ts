import { NextApiRequest } from 'next'
import { createChatMessageCreatedRealtimeEvent } from '@app-core/contracts/message-slice-realtime'
import { NextApiResponseServerIo } from '@/types'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { emitMessageSliceRealtimeEvent } from '../utils/message-slice-realtime'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const profile = await currentProfilePages(req)
    const { content, fileUrl } = req.body
    const { serverId, channelId } = req.query

    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID Missing' })
    }

    if (!content) {
      return res.status(400).json({ error: 'Content Missing' })
    }

    const response = await requestBackendApi({
      path: `/api/messages?serverId=${encodeURIComponent(serverId as string)}&channelId=${encodeURIComponent(channelId as string)}`,
      method: 'POST',
      body: {
        content,
        fileUrl,
      },
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status >= 200 && parsedResponse.status < 300 && parsedResponse.isJson) {
      emitMessageSliceRealtimeEvent(
        res,
        createChatMessageCreatedRealtimeEvent(String(channelId), parsedResponse.data),
      )
    }

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.log('[MESSAGE_POST]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
