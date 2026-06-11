import type { UnreadAttentionLevel, UnreadMessageCreatedRealtimePayload } from '@app-core/contracts'

export const getUnreadMentionCountForMember = (payload: UnreadMessageCreatedRealtimePayload, memberId: string) => {
  if (payload.scope !== 'channel') {
    return payload.mentionCount
  }

  if (!payload.mentionedMemberIds) {
    return payload.mentionCount
  }

  return payload.mentionedMemberIds.includes(memberId) ? 1 : 0
}

export const getUnreadAttentionLevel = (params: {
  mentionCount: number
  payload: UnreadMessageCreatedRealtimePayload
}): UnreadAttentionLevel => {
  if (params.mentionCount > 0) {
    return 'mention'
  }

  return params.payload.attentionLevel
}
