export type DomainTimestamp = Date

export const ChannelType = {
  TEXT: 'TEXT',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
} as const

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType]

export const MemberRole = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  GUEST: 'GUEST',
} as const

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

export interface ProfileDto {
  id: string
  userId: string
  name: string
  imageUrl: string
  email: string
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
}

export interface ServerDto {
  id: string
  name: string
  imageUrl: string
  inviteCode: string
  profileId: string
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
}

export interface ChannelDto {
  id: string
  name: string
  type: ChannelType
  profileId: string
  serverId: string
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
}

export interface MemberDto {
  id: string
  role: MemberRole
  profileId: string
  serverId: string
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
}

export interface MessageDto {
  id: string
  content: string
  fileUrl: string | null
  memberId: string
  channelId: string
  deleted: boolean
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
  mentions?: MessageMentionDto[]
}

export interface ConversationDto {
  id: string
  memberOneId: string
  memberTwoId: string
  createdAt: DomainTimestamp
  updatedAt: DomainTimestamp
}

export type MemberWithProfileDto = MemberDto & {
  profile: ProfileDto
}

export type MessageMentionKind = 'USER' | 'ALL'

export interface MessageMentionDto {
  id: string
  messageId: string
  memberId: string
  kind: MessageMentionKind
  member: MemberWithProfileDto
  createdAt: DomainTimestamp
}

export type ServerListItemDto = ServerDto & {
  initialChannelId: string | null
}

export type ServerMembersProfilesDto = ServerDto & {
  members: MemberWithProfileDto[]
  channels: ChannelDto[]
}

export type ServerMembershipSnapshotDto = ServerDto & {
  members: MemberWithProfileDto[]
}

export type ChatMessageDto = MessageDto & {
  member: MemberWithProfileDto
}

export type ConversationWithMembersDto = ConversationDto & {
  memberOne: MemberWithProfileDto
  memberTwo: MemberWithProfileDto
}

export type UnreadAttentionLevel = 'none' | 'unread' | 'mention' | 'reply'

export interface ChannelUnreadSummaryItemDto {
  channelId: string
  lastReadAt: DomainTimestamp
  unreadCount: number
  mentionCount: number
  replyCount: number
  attentionLevel: UnreadAttentionLevel
}

export interface ConversationUnreadSummaryItemDto {
  conversationId: string
  memberId: string
  lastReadAt: DomainTimestamp
  unreadCount: number
  mentionCount: number
  replyCount: number
  attentionLevel: UnreadAttentionLevel
}

export interface ServerUnreadSummaryDto {
  serverId: string
  channels: ChannelUnreadSummaryItemDto[]
  conversations: ConversationUnreadSummaryItemDto[]
}

export interface GlobalServerUnreadSummaryItemDto {
  serverId: string
  memberId: string
  unreadCount: number
  mentionCount: number
  replyCount: number
  attentionLevel: UnreadAttentionLevel
}

export interface GlobalUnreadSummaryDto {
  totalUnreadCount: number
  servers: GlobalServerUnreadSummaryItemDto[]
}
