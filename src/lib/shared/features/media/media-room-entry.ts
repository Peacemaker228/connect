import { ChannelType } from '@app-core/contracts'
import type { MediaRoomMode, MediaRoomScope, MediaStatePatch } from '@app-core/contracts'

export type MediaRoomEntry = {
  scope: MediaRoomScope
  mode: MediaRoomMode
  desiredState: MediaStatePatch
  legacyLiveKitRoomId: string
}

type ChannelMediaRoomEntryInput = {
  serverId: string
  channelId: string
  channelType: ChannelType
}

type ConversationMediaRoomEntryInput = {
  serverId: string
  conversationId: string
}

const createDesiredState = ({ audio, video }: { audio: boolean; video: boolean }): MediaStatePatch => ({
  desired: {
    audio,
    video,
    screenShare: false,
  },
})

export const createChannelMediaRoomEntry = ({
  serverId,
  channelId,
  channelType,
}: ChannelMediaRoomEntryInput): MediaRoomEntry => ({
  scope: {
    kind: 'channel',
    serverId,
    channelId,
  },
  mode: 'persistent-channel',
  desiredState: createDesiredState({
    audio: channelType === ChannelType.AUDIO || channelType === ChannelType.VIDEO,
    video: channelType === ChannelType.VIDEO,
  }),
  legacyLiveKitRoomId: channelId,
})

export const createConversationMediaRoomEntry = ({
  serverId,
  conversationId,
}: ConversationMediaRoomEntryInput): MediaRoomEntry => ({
  scope: {
    kind: 'conversation',
    serverId,
    conversationId,
  },
  mode: 'private-call',
  desiredState: createDesiredState({
    audio: true,
    video: true,
  }),
  legacyLiveKitRoomId: conversationId,
})
