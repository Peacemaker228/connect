import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const profile = await currentProfilePages(req)

    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { messageId, serverId, channelId } = req.query

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID Missing' })
    }

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID Missing' })
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID Missing' })
    }

    const content = req.body?.content

    if (req.method === 'PATCH' && !content) {
      return res.status(400).json({ error: 'Content Missing' })
    }

    const response = await requestBackendApi({
      path: `/api/messages/${encodeURIComponent(messageId as string)}?serverId=${encodeURIComponent(serverId as string)}&channelId=${encodeURIComponent(channelId as string)}`,
      method: req.method,
      body: req.method === 'PATCH' ? { content } : undefined,
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.log('[message_Id]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
