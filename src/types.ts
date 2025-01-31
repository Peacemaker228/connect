import { Server, Member, Profile } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type TServerMembersProfiles = Server & {
  members: (Member & { profile: Profile })[]
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
