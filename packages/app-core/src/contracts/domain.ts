export type DomainTimestamp = Date

export type ChannelType = 'TEXT' | 'AUDIO' | 'VIDEO'

export type MemberRole = 'ADMIN' | 'MODERATOR' | 'GUEST'

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
}

export type MemberWithProfileDto = MemberDto & {
  profile: ProfileDto
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
