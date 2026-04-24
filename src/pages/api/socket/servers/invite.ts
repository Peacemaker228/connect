import { NextApiRequest } from 'next'

import { ERoutes, getSignInRedirectUrl } from '@app-core/routing/routes'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'
import { NextApiResponseServerIo } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { inviteCode } = req.body

  if (!inviteCode) {
    return res.status(400).json({ redirectUrl: ERoutes.MAIN_PAGE })
  }

  const profile = await currentProfilePages(req)

  if (!profile) {
    return res.status(401).json({ redirectUrl: getSignInRedirectUrl(`/invite/${inviteCode}?mode=browser`) })
  }

  try {
    const response = await requestBackendApi({
      path: '/api/invites/join',
      method: 'POST',
      body: {
        inviteCode,
      },
      headers: {
        'x-profile-id': profile.id,
      },
    })
    const parsedResponse = await readBackendApiResponse(response)

    if (parsedResponse.status === 200 && parsedResponse.isJson && res.socket.server.io) {
      const redirectUrl =
        typeof parsedResponse.data === 'object' && parsedResponse.data && 'redirectUrl' in parsedResponse.data
          ? String(parsedResponse.data.redirectUrl)
          : ''
      const serverId = redirectUrl.split('/').filter(Boolean).at(-1)

      if (serverId) {
        res.socket.server.io.emit(`server:${serverId}:members`, {
          action: 'member_added',
          serverId,
        })
      }
    }

    if (parsedResponse.isJson) {
      return res.status(parsedResponse.status).json(parsedResponse.data)
    }

    return res.status(parsedResponse.status).send(parsedResponse.data)
  } catch (error) {
    console.error('Invite failed:', error)
    return res.status(500).json({ redirectUrl: ERoutes.MAIN_PAGE })
  }
}
