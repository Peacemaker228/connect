import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'

type InviteValidationSnapshot = {
  isValidInvite: boolean
}

export const validateInviteCode = async (inviteCode: string) => {
  const response = await requestBackendApi({
    path: `/api/invites/validate/${encodeURIComponent(inviteCode)}`,
  })

  if (!response.ok) {
    throw new Error(`Failed to validate invite: ${response.status}`)
  }

  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected invite validation response status: ${parsedResponse.status}`)
  }

  const snapshot = parsedResponse.data as InviteValidationSnapshot

  return snapshot.isValidInvite
}
