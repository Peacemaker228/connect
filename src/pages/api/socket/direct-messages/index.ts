import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { currentBackendAuthHeadersPages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeaders = await currentBackendAuthHeadersPages(req)
    const { content, fileUrl } = req.body
    const { conversationId } = req.query

    if (!authHeaders) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID Missing' })
    }

    if (!content) {
      return res.status(400).json({ error: 'Content Missing' })
    }

    const response = await requestBackendApi({
      path: `/api/direct-messages?conversationId=${encodeURIComponent(conversationId as string)}`,
      method: 'POST',
      body: {
        content,
        fileUrl,
      },
      headers: authHeaders,
    })
    const parsedResponse = await readBackendApiResponse(response)

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.log('[DIRECT_MESSAGES_POST]', err)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
