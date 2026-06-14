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

export const getUnreadReplyCountForMember = (payload: UnreadMessageCreatedRealtimePayload, memberId: string) => {
  if (payload.scope === 'channel') {
    return payload.repliedToMemberId === memberId ? payload.replyCount : 0
  }

  return payload.replyCount
}

export const getUnreadAttentionLevel = (params: {
  mentionCount: number
  replyCount: number
  unreadCount: number
}): UnreadAttentionLevel => {
  if (params.mentionCount > 0) {
    return 'mention'
  }

  if (params.replyCount > 0) {
    return 'reply'
  }

  return params.unreadCount > 0 ? 'unread' : 'none'
}
