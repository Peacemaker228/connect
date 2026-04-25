import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { currentBackendAuthHeadersPages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeaders = await currentBackendAuthHeadersPages(req)

    if (!authHeaders) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { directMessageId, conversationId } = req.query

    if (!directMessageId) {
      return res.status(400).json({ error: 'Direct Message ID Missing' })
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID Missing' })
    }

    const content = req.body?.content

    if (req.method === 'PATCH' && !content) {
      return res.status(400).json({ error: 'Content Missing' })
    }

    const response = await requestBackendApi({
      path: `/api/direct-messages/${encodeURIComponent(directMessageId as string)}?conversationId=${encodeURIComponent(conversationId as string)}`,
      method: req.method,
      body: req.method === 'PATCH' ? { content } : undefined,
      headers: authHeaders,
    })
    const parsedResponse = await readBackendApiResponse(response)

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.log('[message_Id]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
