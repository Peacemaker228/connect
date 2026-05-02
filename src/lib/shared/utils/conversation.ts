import type { ConversationWithMembersDto } from '@app-core/contracts'
import type { BackendAuthHeaders } from '@/lib/shared/utils/backend-auth-context'
import { readBackendApiResponse, requestBackendApi } from '@/lib/shared/utils/backend-api'

type GetOrCreateConversationParams = {
  authHeaders: BackendAuthHeaders
  memberId: string
  serverId: string
}

export type ConversationBootstrapResult =
  | {
      status: 'ok'
      conversation: ConversationWithMembersDto
    }
  | {
      status: 'unauthorized'
    }
  | {
      status: 'not-found'
    }

export const getOrCreateConversation = async ({
  authHeaders,
  memberId,
  serverId,
}: GetOrCreateConversationParams): Promise<ConversationBootstrapResult> => {
  const response = await requestBackendApi({
    path: `/api/direct-messages/conversations/${memberId}?serverId=${encodeURIComponent(serverId)}`,
    method: 'POST',
    headers: authHeaders,
  })

  if (response.status === 401) {
    return { status: 'unauthorized' }
  }

  if (response.status === 404) {
    return { status: 'not-found' }
  }

  if (!response.ok) {
    throw new Error(`Failed to get conversation bootstrap snapshot: ${response.status}`)
  }

  const parsedResponse = await readBackendApiResponse(response)

  if (!parsedResponse.isJson) {
    throw new Error(`Unexpected conversation bootstrap response status: ${parsedResponse.status}`)
  }

  return {
    status: 'ok',
    conversation: parsedResponse.data as ConversationWithMembersDto,
  }
}
