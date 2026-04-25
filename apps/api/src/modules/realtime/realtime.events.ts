export type RealtimeEvent<TPayload> = {
  key: string;
  payload: TPayload;
};

export const getServerChannelsRealtimeKey = (serverId: string) => `server:${serverId}:channels`;

export const getServerMembersRealtimeKey = (serverId: string) => `server:${serverId}:members`;

export const getChatMessagesRealtimeKey = (chatId: string) => `chat:${chatId}:messages`;

export const getChatMessagesUpdateRealtimeKey = (chatId: string) => `chat:${chatId}:messages:update`;

export const createChannelCreatedRealtimeEvent = (
  serverId: string,
  channel: { name?: string; type?: string },
): RealtimeEvent<{ action: 'channel_created'; channel: { name?: string; type?: string } }> => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_created',
    channel,
  },
});

export const createChannelUpdatedRealtimeEvent = (
  serverId: string,
  channel: { id: string; name?: string; type?: string },
): RealtimeEvent<{ action: 'channel_updated'; channel: { id: string; name?: string; type?: string } }> => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_updated',
    channel,
  },
});

export const createChannelDeletedRealtimeEvent = (
  serverId: string,
  channelId: string,
): RealtimeEvent<{ action: 'channel_deleted'; channelId: string }> => ({
  key: getServerChannelsRealtimeKey(serverId),
  payload: {
    action: 'channel_deleted',
    channelId,
  },
});

export const createMemberDeletedRealtimeEvent = (
  serverId: string,
  memberId: string,
): RealtimeEvent<{ action: 'member_deleted'; memberId: string }> => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_deleted',
    memberId,
  },
});

export const createMemberRoleUpdatedRealtimeEvent = (
  serverId: string,
  memberId: string,
): RealtimeEvent<{ action: 'member_role_updated'; memberId: string }> => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_role_updated',
    memberId,
  },
});

export const createMemberLeftRealtimeEvent = (
  serverId: string,
  memberId: string,
): RealtimeEvent<{ action: 'member_left'; memberId: string }> => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_left',
    memberId,
  },
});

export const createMemberAddedRealtimeEvent = (
  serverId: string,
): RealtimeEvent<{ action: 'member_added'; serverId: string }> => ({
  key: getServerMembersRealtimeKey(serverId),
  payload: {
    action: 'member_added',
    serverId,
  },
});

export const createChatMessageCreatedRealtimeEvent = <TPayload>(
  chatId: string,
  payload: TPayload,
): RealtimeEvent<TPayload> => ({
  key: getChatMessagesRealtimeKey(chatId),
  payload,
});

export const createChatMessageUpdatedRealtimeEvent = <TPayload>(
  chatId: string,
  payload: TPayload,
): RealtimeEvent<TPayload> => ({
  key: getChatMessagesUpdateRealtimeKey(chatId),
  payload,
});
