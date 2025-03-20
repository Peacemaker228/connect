import { Server, Member, Profile, Channel } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type TServerMembersProfiles = Server & {
  members: (Member & { profile: Profile })[]
  channels: Channel[]
}

export enum EGeneral {
  GENERAL = 'general',
}

export type TSearchType = 'member' | 'channel'

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export type TChannelConversation = 'channel' | 'conversation'

export enum ELocales {
  EN = 'en',
  RU = 'ru',
}

export enum ECookiesKeys {
  NEXT_LOCALE = 'NEXT_LOCALE',
}
