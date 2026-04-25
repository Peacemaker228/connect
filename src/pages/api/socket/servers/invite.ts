import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'
import { ERoutes, getSignInRedirectUrl } from '@app-core/routing/routes'
import { currentProfilePages } from '@/lib/shared/utils/current-profile-pages'
import { readBackendApiResponse, requestBackendApi, writePagesProxyResponse } from '@/lib/shared/utils/backend-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    return writePagesProxyResponse(res, parsedResponse)
  } catch (error) {
    console.error('Invite failed:', error)
    return res.status(500).json({ redirectUrl: ERoutes.MAIN_PAGE })
  }
}
