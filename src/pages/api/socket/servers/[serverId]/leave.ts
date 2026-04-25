import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    return writePagesProxyResponse(res, parsedResponse)
  } catch (error) {
    console.error('[SERVER_LEAVE_ERROR]', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
