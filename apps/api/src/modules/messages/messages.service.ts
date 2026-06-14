import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { MemberRole, MessageMentionKind, Prisma } from '@prisma/client'

import { PrismaService } from '../../common/database/prisma.service'
import { StorageService } from '../storage/storage.service'

type MessageMutationBody = {
  content?: string
  fileUrl?: string | null
  replyToMessageId?: string | null
}

type MentionCandidateMember = {
  id: string
  profileId: string
  profile: {
    name: string
  }
}

type ResolvedMessageMention = {
  kind: MessageMentionKind
  memberId: string
}

type MessageContextDirection = 'newer' | 'older'

const MESSAGE_BATCH_SIZE = 10
const MESSAGE_CONTEXT_RADIUS = 5
const MESSAGE_INCLUDE = {
  member: {
    include: {
      profile: true,
    },
  },
  mentions: {
    include: {
      member: {
        include: {
          profile: true,
        },
      },
    },
  },
  replyToMessage: {
    include: {
      member: {
        include: {
          profile: true,
        },
      },
      mentions: {
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MessageInclude
type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>
type MessageReplyRelation = NonNullable<MessageWithRelations['replyToMessage']>
const STABLE_MEMBER_MENTION_PATTERN = /<@([0-9a-fA-F-]{36})>/g
const STABLE_ALL_MENTION_PATTERN = /<@all>/i

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getMessages(profileId: string | undefined, channelId: string | undefined, cursor: string | undefined) {
    this.requireProfileId(profileId)

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST)
    }

    const messages = await this.prisma.message.findMany({
      take: MESSAGE_BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor,
          }
        : undefined,
      where: {
        channelId,
      },
      include: MESSAGE_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      items: messages.map((message) => this.toChatMessage(message)),
      nextCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[MESSAGE_BATCH_SIZE - 1].id : null,
    }
  }

  async getMessageContext(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string | undefined,
    direction: string | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)
    const resolvedServerId = this.requireValue(serverId, 'Server ID Missing')
    const resolvedChannelId = this.requireValue(channelId, 'Channel ID Missing')
    const resolvedMessageId = this.requireValue(messageId, 'Message ID Missing')
    const contextDirection = this.normalizeContextDirection(direction)

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: resolvedChannelId,
        serverId: resolvedServerId,
        server: {
          members: {
            some: {
              profileId: resolvedProfileId,
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND)
    }

    const targetMessage = await this.prisma.message.findFirst({
      where: {
        id: resolvedMessageId,
        channelId: resolvedChannelId,
      },
      include: MESSAGE_INCLUDE,
    })

    if (!targetMessage) {
      throw new HttpException('Message Not Found', HttpStatus.NOT_FOUND)
    }

    if (contextDirection === 'newer') {
      const messages = await this.findNewerMessages(resolvedChannelId, targetMessage, MESSAGE_BATCH_SIZE)

      return {
        items: messages.map((message) => this.toChatMessage(message)),
        newerCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[0].id : null,
        olderCursor: null,
        nextCursor: null,
      }
    }

    if (contextDirection === 'older') {
      const messages = await this.findOlderMessages(resolvedChannelId, targetMessage, MESSAGE_BATCH_SIZE)

      return {
        items: messages.map((message) => this.toChatMessage(message)),
        newerCursor: null,
        olderCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[messages.length - 1].id : null,
        nextCursor: null,
      }
    }

    const newerMessages = await this.prisma.message.findMany({
      take: MESSAGE_CONTEXT_RADIUS,
      where: {
        channelId: resolvedChannelId,
        OR: [
          {
            createdAt: {
              gt: targetMessage.createdAt,
            },
          },
          {
            createdAt: targetMessage.createdAt,
            id: {
              gt: targetMessage.id,
            },
          },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    const olderMessages = await this.prisma.message.findMany({
      take: MESSAGE_CONTEXT_RADIUS,
      where: {
        channelId: resolvedChannelId,
        OR: [
          {
            createdAt: {
              lt: targetMessage.createdAt,
            },
          },
          {
            createdAt: targetMessage.createdAt,
            id: {
              lt: targetMessage.id,
            },
          },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
    const messages = [...newerMessages.reverse(), targetMessage, ...olderMessages]

    return {
      items: messages.map((message) => this.toChatMessage(message)),
      newerCursor: newerMessages.length === MESSAGE_CONTEXT_RADIUS ? messages[0].id : null,
      olderCursor: olderMessages.length === MESSAGE_CONTEXT_RADIUS ? messages[messages.length - 1].id : null,
      nextCursor: null,
    }
  }

  async createMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    body: MessageMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST)
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST)
    }

    const content = this.normalizeMessageContent(body.content)

    if (!content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST)
    }

    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: resolvedProfileId,
          },
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!server) {
      throw new HttpException('Server Not Found', HttpStatus.NOT_FOUND)
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    })

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND)
    }

    const member = server.members.find((candidate) => candidate.profileId === resolvedProfileId)

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    const finalizedFileUrl =
      typeof body.fileUrl === 'string'
        ? await this.storageService.finalizeStoredValue(resolvedProfileId, 'messageFile', body.fileUrl)
        : body.fileUrl
    const mentions = this.resolveMessageMentions(content, server.members)
    const replyToMessageId = await this.resolveReplyToMessageId(body.replyToMessageId, channelId)

    const message = await this.prisma.message.create({
      data: {
        content,
        fileUrl: finalizedFileUrl,
        channelId,
        memberId: member.id,
        replyToMessageId,
        mentions: mentions.length
          ? {
              create: mentions,
            }
          : undefined,
      },
      include: MESSAGE_INCLUDE,
    })

    return this.toChatMessage(message)
  }

  async updateMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
    body: MessageMutationBody,
  ) {
    const { member, message, server } = await this.resolveMessageMutationAccess(
      profileId,
      serverId,
      channelId,
      messageId,
    )

    const isMessageOwner = message.memberId === member.id

    if (!isMessageOwner) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    const content = this.normalizeMessageContent(body.content)

    if (!content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST)
    }

    const mentions = this.resolveMessageMentions(content, server.members)

    const updatedMessage = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
        mentions: {
          deleteMany: {},
          create: mentions,
        },
      },
      include: MESSAGE_INCLUDE,
    })

    return this.toChatMessage(updatedMessage)
  }

  async deleteMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
  ) {
    await this.resolveMessageMutationAccess(profileId, serverId, channelId, messageId)

    const deletedMessage = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted.',
        deleted: true,
        mentions: {
          deleteMany: {},
        },
      },
      include: MESSAGE_INCLUDE,
    })

    return this.toChatMessage(deletedMessage)
  }

  private toChatMessage(message: MessageWithRelations) {
    const { replyToMessage, ...chatMessage } = message

    return {
      ...chatMessage,
      replyTo: replyToMessage ? this.toReplyPreview(replyToMessage) : null,
    }
  }

  private toReplyPreview(message: MessageReplyRelation) {
    return {
      id: message.id,
      content: message.content,
      fileUrl: message.fileUrl,
      deleted: message.deleted,
      memberId: message.memberId,
      member: message.member,
      createdAt: message.createdAt,
      mentions: message.mentions,
    }
  }

  private async resolveReplyToMessageId(replyToMessageId: string | null | undefined, channelId: string) {
    const normalizedReplyToMessageId = replyToMessageId?.trim()

    if (!normalizedReplyToMessageId) {
      return null
    }

    const replyToMessage = await this.prisma.message.findFirst({
      where: {
        id: normalizedReplyToMessageId,
        channelId,
        deleted: false,
      },
      select: {
        id: true,
      },
    })

    if (!replyToMessage) {
      throw new HttpException('Reply Message Not Found', HttpStatus.BAD_REQUEST)
    }

    return replyToMessage.id
  }

  private async resolveMessageMutationAccess(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST)
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST)
    }

    if (!messageId) {
      throw new HttpException('Message ID Missing', HttpStatus.BAD_REQUEST)
    }

    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: resolvedProfileId,
          },
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!server) {
      throw new HttpException('Server Not Found', HttpStatus.NOT_FOUND)
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    })

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND)
    }

    const member = server.members.find((candidate) => candidate.profileId === resolvedProfileId)

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
      },
      include: MESSAGE_INCLUDE,
    })

    if (!message || message.deleted) {
      throw new HttpException('Message Not Found', HttpStatus.NOT_FOUND)
    }

    const isMessageOwner = message.memberId === member.id
    const isAdmin = member.role === MemberRole.ADMIN
    const isModerator = member.role === MemberRole.MODERATOR

    if (!isMessageOwner && !isAdmin && !isModerator) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    return {
      member,
      message,
      server,
    }
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    return profileId
  }

  private normalizeMessageContent(content: string | undefined) {
    return content?.trim() ?? ''
  }

  private requireValue(value: string | undefined, message: string) {
    if (!value) {
      throw new HttpException(message, HttpStatus.BAD_REQUEST)
    }

    return value
  }

  private normalizeContextDirection(direction: string | undefined): MessageContextDirection | null {
    if (!direction) {
      return null
    }

    if (direction === 'newer' || direction === 'older') {
      return direction
    }

    throw new HttpException('Invalid Context Direction', HttpStatus.BAD_REQUEST)
  }

  private async findNewerMessages(channelId: string, cursorMessage: MessageWithRelations, take: number) {
    const messages = await this.prisma.message.findMany({
      take,
      where: {
        channelId,
        OR: [
          {
            createdAt: {
              gt: cursorMessage.createdAt,
            },
          },
          {
            createdAt: cursorMessage.createdAt,
            id: {
              gt: cursorMessage.id,
            },
          },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })

    return messages.reverse()
  }

  private findOlderMessages(channelId: string, cursorMessage: MessageWithRelations, take: number) {
    return this.prisma.message.findMany({
      take,
      where: {
        channelId,
        OR: [
          {
            createdAt: {
              lt: cursorMessage.createdAt,
            },
          },
          {
            createdAt: cursorMessage.createdAt,
            id: {
              lt: cursorMessage.id,
            },
          },
        ],
      },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
  }

  private resolveMessageMentions(content: string, members: MentionCandidateMember[]): ResolvedMessageMention[] {
    const targetByMemberId = new Map<string, MessageMentionKind>()
    const mentionAll = STABLE_ALL_MENTION_PATTERN.test(content) || this.containsMentionToken(content, '@all')

    if (mentionAll) {
      members.forEach((member) => {
        targetByMemberId.set(member.id, MessageMentionKind.ALL)
      })

      return Array.from(targetByMemberId, ([memberId, kind]) => ({ memberId, kind }))
    }

    const memberById = new Map(members.map((member) => [member.id, member]))
    const stableMemberMatches = content.matchAll(STABLE_MEMBER_MENTION_PATTERN)

    for (const match of stableMemberMatches) {
      const memberId = match[1]
      const member = memberById.get(memberId)

      if (member) {
        targetByMemberId.set(member.id, MessageMentionKind.USER)
      }
    }

    const membersByNormalizedName = new Map<string, MentionCandidateMember[]>()

    members.forEach((member) => {
      const normalizedName = this.normalizeMentionName(member.profile.name)

      if (!normalizedName) {
        return
      }

      membersByNormalizedName.set(normalizedName, [...(membersByNormalizedName.get(normalizedName) ?? []), member])
    })

    for (const [normalizedName, candidates] of membersByNormalizedName) {
      if (candidates.length !== 1) {
        continue
      }

      const [member] = candidates

      if (this.containsMentionToken(content, `@${normalizedName}`)) {
        targetByMemberId.set(member.id, MessageMentionKind.USER)
      }
    }

    return Array.from(targetByMemberId, ([memberId, kind]) => ({ memberId, kind }))
  }

  private normalizeMentionName(value: string) {
    return value.trim().toLocaleLowerCase()
  }

  private containsMentionToken(content: string, token: string) {
    const normalizedContent = content.toLocaleLowerCase()
    const normalizedToken = token.toLocaleLowerCase()
    let searchFrom = 0

    while (searchFrom < normalizedContent.length) {
      const index = normalizedContent.indexOf(normalizedToken, searchFrom)

      if (index === -1) {
        return false
      }

      const before = normalizedContent[index - 1]
      const after = normalizedContent[index + normalizedToken.length]

      if (this.isMentionBoundary(before) && this.isMentionBoundary(after)) {
        return true
      }

      searchFrom = index + normalizedToken.length
    }

    return false
  }

  private isMentionBoundary(value: string | undefined) {
    return !value || /[\s.,!?;:()[\]{}"'`]/.test(value)
  }
}
