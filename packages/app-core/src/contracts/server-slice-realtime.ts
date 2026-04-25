export const SERVER_CHANNEL_REALTIME_ACTIONS = [
  'channel_updated',
  'channel_deleted',
  'channel_created',
] as const

export const SERVER_MEMBER_REALTIME_ACTIONS = [
  'member_deleted',
  'member_role_updated',
  'member_left',
  'member_added',
] as const

export type ServerChannelRealtimeAction = (typeof SERVER_CHANNEL_REALTIME_ACTIONS)[number]
export type ServerMemberRealtimeAction = (typeof SERVER_MEMBER_REALTIME_ACTIONS)[number]

export type ServerChannelsRealtimePayload =
  | {
      action: 'channel_created'
      channel: {
        name?: string
        type?: string
      }
    }
  | {
      action: 'channel_updated'
      channel: {
        id: string
        name?: string
        type?: string
      }
    }
  | {
      action: 'channel_deleted'
      channelId: string
    }

export type ServerMembersRealtimePayload =
  | {
      action: 'member_deleted'
      memberId: string
    }
  | {
      action: 'member_role_updated'
      memberId: string
    }
  | {
      action: 'member_left'
      memberId: string
    }
  | {
      action: 'member_added'
      serverId: string
    }

export type ServerSliceRealtimeEvent =
  | {
      key: string
      payload: ServerChannelsRealtimePayload
    }
  | {
      key: string
      payload: ServerMembersRealtimePayload
    }

export const getServerChannelsRealtimeKey = (serverId: string) => `server:${serverId}:channels`

export const getServerMembersRealtimeKey = (serverId: string) => `server:${serverId}:members`

export const createChannelCreatedRealtimeEvent = (
  serverId: string,
  channel: { name?: string; type?: string },
): ServerSliceRealtimeEvent => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_created',
    channel,
  },
})

export const createChannelUpdatedRealtimeEvent = (
  serverId: string,
  channel: { id: string; name?: string; type?: string },
): ServerSliceRealtimeEvent => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_updated',
    channel,
  },
})

export const createChannelDeletedRealtimeEvent = (
  serverId: string,
  channelId: string,
): ServerSliceRealtimeEvent => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_deleted',
    channelId,
  },
})

export const createMemberDeletedRealtimeEvent = (
  serverId: string,
  memberId: string,
): ServerSliceRealtimeEvent => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_deleted',
    memberId,
  },
})

export const createMemberRoleUpdatedRealtimeEvent = (
  serverId: string,
  memberId: string,
): ServerSliceRealtimeEvent => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_role_updated',
    memberId,
  },
})

export const createMemberLeftRealtimeEvent = (
  serverId: string,
  memberId: string,
): ServerSliceRealtimeEvent => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_left',
    memberId,
  },
})

export const createMemberAddedRealtimeEvent = (
  serverId: string,
): ServerSliceRealtimeEvent => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_added',
    serverId,
  },
})
