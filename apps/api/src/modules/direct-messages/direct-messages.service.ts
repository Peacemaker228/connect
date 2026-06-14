import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { MemberRole, Prisma } from '@prisma/client'

import { PrismaService } from '../../common/database/prisma.service'
import { StorageService } from '../storage/storage.service'

type DirectMessageMutationBody = {
  content?: string
  fileUrl?: string | null
  replyToMessageId?: string | null
}

const MESSAGE_BATCH_SIZE = 10
const DIRECT_MESSAGE_INCLUDE = {
  member: {
    include: {
      profile: true,
    },
  },
  replyToDirectMessage: {
    include: {
      member: {
        include: {
          profile: true,
        },
      },
    },
  },
} satisfies Prisma.DirectMessageInclude
type DirectMessageWithRelations = Prisma.DirectMessageGetPayload<{ include: typeof DIRECT_MESSAGE_INCLUDE }>
type DirectMessageReplyRelation = NonNullable<DirectMessageWithRelations['replyToDirectMessage']>
const CONVERSATION_INCLUDE = {
  memberOne: {
    include: {
      profile: true,
    },
  },
  memberTwo: {
    include: {
      profile: true,
    },
  },
} as const

@Injectable()
export class DirectMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getMessages(profileId: string | undefined, conversationId: string | undefined, cursor: string | undefined) {
    const { conversation } = await this.resolveConversationMember(profileId, conversationId)

    const messages = await this.prisma.directMessage.findMany({
      take: MESSAGE_BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor,
          }
        : undefined,
      where: {
        conversationId: conversation.id,
      },
      include: DIRECT_MESSAGE_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      items: messages.map((message) => this.toChatMessage(message)),
      nextCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[MESSAGE_BATCH_SIZE - 1].id : null,
    }
  }

  async getOrCreateConversation(
    profileId: string | undefined,
    serverId: string | undefined,
    memberId: string | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST)
    }

    if (!memberId) {
      throw new HttpException('Member ID Missing', HttpStatus.BAD_REQUEST)
    }

    const currentMember = await this.prisma.member.findFirst({
      where: {
        serverId,
        profileId: resolvedProfileId,
      },
      include: {
        profile: true,
      },
    })

    if (!currentMember) {
      throw new HttpException('Current Member Not Found', HttpStatus.NOT_FOUND)
    }

    const targetMember = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        serverId,
      },
      include: {
        profile: true,
      },
    })

    if (!targetMember) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    if (targetMember.id === currentMember.id) {
      throw new HttpException('Self Conversation Not Allowed', HttpStatus.BAD_REQUEST)
    }

    const existingConversation = await this.findConversation(currentMember.id, targetMember.id)

    if (existingConversation) {
      return existingConversation
    }

    return this.prisma.conversation.create({
      data: {
        memberOneId: currentMember.id,
        memberTwoId: targetMember.id,
      },
      include: CONVERSATION_INCLUDE,
    })
  }

  async createMessage(
    profileId: string | undefined,
    conversationId: string | undefined,
    body: DirectMessageMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST)
    }

    const content = this.normalizeMessageContent(body.content)

    if (!content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST)
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: resolvedProfileId,
            },
          },
          {
            memberTwo: {
              profileId: resolvedProfileId,
            },
          },
        ],
      },
      include: CONVERSATION_INCLUDE,
    })

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND)
    }

    const member =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    const finalizedFileUrl =
      typeof body.fileUrl === 'string'
        ? await this.storageService.finalizeStoredValue(resolvedProfileId, 'messageFile', body.fileUrl)
        : body.fileUrl
    const replyToDirectMessageId = await this.resolveReplyToDirectMessageId(body.replyToMessageId, conversationId)

    const message = await this.prisma.directMessage.create({
      data: {
        content,
        fileUrl: finalizedFileUrl,
        conversationId,
        memberId: member.id,
        replyToDirectMessageId,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    })

    return this.toChatMessage(message)
  }

  async getConversationRealtimeContext(profileId: string | undefined, conversationId: string | undefined) {
    const { conversation, member } = await this.resolveConversationMember(profileId, conversationId)
    const recipientMemberId =
      conversation.memberOneId === member.id ? conversation.memberTwoId : conversation.memberOneId

    return {
      serverId: conversation.memberOne.serverId,
      recipientMemberId,
    }
  }

  async updateMessage(
    profileId: string | undefined,
    conversationId: string | undefined,
    directMessageId: string,
    body: DirectMessageMutationBody,
  ) {
    const { directMessage, member } = await this.resolveMessageMutationAccess(
      profileId,
      conversationId,
      directMessageId,
    )

    const isMessageOwner = directMessage.memberId === member.id

    if (!isMessageOwner) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    const content = this.normalizeMessageContent(body.content)

    if (!content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST)
    }

    const updatedMessage = await this.prisma.directMessage.update({
      where: {
        id: directMessageId,
      },
      data: {
        content,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    })

    return this.toChatMessage(updatedMessage)
  }

  async deleteMessage(profileId: string | undefined, conversationId: string | undefined, directMessageId: string) {
    await this.resolveMessageMutationAccess(profileId, conversationId, directMessageId)

    const deletedMessage = await this.prisma.directMessage.update({
      where: {
        id: directMessageId,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted.',
        deleted: true,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    })

    return this.toChatMessage(deletedMessage)
  }

  private toChatMessage(message: DirectMessageWithRelations) {
    const { replyToDirectMessage, ...chatMessage } = message

    return {
      ...chatMessage,
      replyTo: replyToDirectMessage ? this.toReplyPreview(replyToDirectMessage) : null,
    }
  }

  private toReplyPreview(message: DirectMessageReplyRelation) {
    return {
      id: message.id,
      content: message.content,
      fileUrl: message.fileUrl,
      deleted: message.deleted,
      memberId: message.memberId,
      member: message.member,
      createdAt: message.createdAt,
    }
  }

  private async resolveReplyToDirectMessageId(replyToMessageId: string | null | undefined, conversationId: string) {
    const normalizedReplyToMessageId = replyToMessageId?.trim()

    if (!normalizedReplyToMessageId) {
      return null
    }

    const replyToDirectMessage = await this.prisma.directMessage.findFirst({
      where: {
        id: normalizedReplyToMessageId,
        conversationId,
        deleted: false,
      },
      select: {
        id: true,
      },
    })

    if (!replyToDirectMessage) {
      throw new HttpException('Reply Message Not Found', HttpStatus.BAD_REQUEST)
    }

    return replyToDirectMessage.id
  }

  private async resolveMessageMutationAccess(
    profileId: string | undefined,
    conversationId: string | undefined,
    directMessageId: string,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!directMessageId) {
      throw new HttpException('Direct Message ID Missing', HttpStatus.BAD_REQUEST)
    }

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST)
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: resolvedProfileId,
            },
          },
          {
            memberTwo: {
              profileId: resolvedProfileId,
            },
          },
        ],
      },
      include: CONVERSATION_INCLUDE,
    })

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND)
    }

    const member =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    const directMessage = await this.prisma.directMessage.findFirst({
      where: {
        id: directMessageId,
        conversationId,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    })

    if (!directMessage || directMessage.deleted) {
      throw new HttpException('Message Not Found', HttpStatus.NOT_FOUND)
    }

    const isMessageOwner = directMessage.memberId === member.id
    const isAdmin = member.role === MemberRole.ADMIN
    const isModerator = member.role === MemberRole.MODERATOR

    if (!isMessageOwner && !isAdmin && !isModerator) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    return {
      directMessage,
      member,
    }
  }

  private async resolveConversationMember(profileId: string | undefined, conversationId: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId)

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST)
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: resolvedProfileId,
            },
          },
          {
            memberTwo: {
              profileId: resolvedProfileId,
            },
          },
        ],
      },
      include: CONVERSATION_INCLUDE,
    })

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND)
    }

    const member =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND)
    }

    return {
      conversation,
      member,
    }
  }

  private async findConversation(memberOneId: string, memberTwoId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            memberOneId,
            memberTwoId,
          },
          {
            memberOneId: memberTwoId,
            memberTwoId: memberOneId,
          },
        ],
      },
      include: CONVERSATION_INCLUDE,
    })
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
}
