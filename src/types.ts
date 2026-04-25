import { Server, Member, Profile, Channel } from '@prisma/client'

export type TServerMembersProfiles = Server & {
  members: (Member & { profile: Profile })[]
  channels: Channel[]
}

export enum EGeneral {
  GENERAL = 'general',
}

export type TSearchType = 'member' | 'channel'

export type TChannelConversation = 'channel' | 'conversation'

export enum ELocales {
  EN = 'en',
  RU = 'ru',
}

export enum ECookiesKeys {
  NEXT_LOCALE = 'NEXT_LOCALE',
}
