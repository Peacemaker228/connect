import type { ServerMembersProfilesDto } from '@app-core/contracts'

export type TServerMembersProfiles = ServerMembersProfilesDto

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
