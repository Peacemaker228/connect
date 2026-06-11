import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { MemberRole, MessageMentionKind } from '@prisma/client'

import { PrismaService } from '../../common/database/prisma.service'
import { StorageService } from '../storage/storage.service'

type MessageMutationBody = {
  content?: string
  fileUrl?: string | null
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

const MESSAGE_BATCH_SIZE = 10
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
} as const
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
      items: messages,
      nextCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[MESSAGE_BATCH_SIZE - 1].id : null,
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
    const mentions = this.resolveMessageMentions(content, server.members, member.id)

    return this.prisma.message.create({
      data: {
        content,
        fileUrl: finalizedFileUrl,
        channelId,
        memberId: member.id,
        mentions: mentions.length
          ? {
              create: mentions,
            }
          : undefined,
      },
      include: MESSAGE_INCLUDE,
    })
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

    const mentions = this.resolveMessageMentions(content, server.members, member.id)

    return this.prisma.message.update({
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
  }

  async deleteMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
  ) {
    await this.resolveMessageMutationAccess(profileId, serverId, channelId, messageId)

    return this.prisma.message.update({
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

  private resolveMessageMentions(
    content: string,
    members: MentionCandidateMember[],
    senderMemberId: string,
  ): ResolvedMessageMention[] {
    const targetByMemberId = new Map<string, MessageMentionKind>()
    const mentionAll = STABLE_ALL_MENTION_PATTERN.test(content) || this.containsMentionToken(content, '@all')

    if (mentionAll) {
      members.forEach((member) => {
        if (member.id !== senderMemberId) {
          targetByMemberId.set(member.id, MessageMentionKind.ALL)
        }
      })

      return Array.from(targetByMemberId, ([memberId, kind]) => ({ memberId, kind }))
    }

    const memberById = new Map(members.map((member) => [member.id, member]))
    const stableMemberMatches = content.matchAll(STABLE_MEMBER_MENTION_PATTERN)

    for (const match of stableMemberMatches) {
      const memberId = match[1]
      const member = memberById.get(memberId)

      if (member && member.id !== senderMemberId) {
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

      if (member.id === senderMemberId) {
        continue
      }

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
