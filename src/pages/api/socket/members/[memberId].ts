import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE' && req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const profile = await currentProfilePages(req)

    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { serverId } = req.query
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

      return writePagesProxyResponse(res, parsedResponse)
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

    return writePagesProxyResponse(res, parsedResponse)
  } catch (err) {
    console.error('[MEMBER_REQUEST_HANDLER]', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
