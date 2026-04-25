import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';

type DirectMessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

const MESSAGE_BATCH_SIZE = 10;
const DIRECT_MESSAGE_INCLUDE = {
  member: {
    include: {
      profile: true,
    },
  },
} as const;
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
} as const;

@Injectable()
export class DirectMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(
    profileId: string | undefined,
    conversationId: string | undefined,
    cursor: string | undefined,
  ) {
    this.requireProfileId(profileId);

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST);
    }

    const messages = await this.prisma.directMessage.findMany({
      take: MESSAGE_BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor,
          }
        : undefined,
      where: {
        conversationId,
      },
      include: DIRECT_MESSAGE_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items: messages,
      nextCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[MESSAGE_BATCH_SIZE - 1].id : null,
    };
  }

  async createMessage(
    profileId: string | undefined,
    conversationId: string | undefined,
    body: DirectMessageMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!body.content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST);
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
    });

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND);
    }

    const member =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo;

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.directMessage.create({
      data: {
        content: body.content,
        fileUrl: body.fileUrl,
        conversationId,
        memberId: member.id,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    });
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
    );

    const isMessageOwner = directMessage.memberId === member.id;

    if (!isMessageOwner) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.directMessage.update({
      where: {
        id: directMessageId,
      },
      data: {
        content: body.content,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    });
  }

  async deleteMessage(
    profileId: string | undefined,
    conversationId: string | undefined,
    directMessageId: string,
  ) {
    await this.resolveMessageMutationAccess(profileId, conversationId, directMessageId);

    return this.prisma.directMessage.update({
      where: {
        id: directMessageId,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted.',
        deleted: true,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    });
  }

  private async resolveMessageMutationAccess(
    profileId: string | undefined,
    conversationId: string | undefined,
    directMessageId: string,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!directMessageId) {
      throw new HttpException('Direct Message ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!conversationId) {
      throw new HttpException('Conversation ID Missing', HttpStatus.BAD_REQUEST);
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
    });

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND);
    }

    const member =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo;

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND);
    }

    const directMessage = await this.prisma.directMessage.findFirst({
      where: {
        id: directMessageId,
        conversationId,
      },
      include: DIRECT_MESSAGE_INCLUDE,
    });

    if (!directMessage || directMessage.deleted) {
      throw new HttpException('Message Not Found', HttpStatus.NOT_FOUND);
    }

    const isMessageOwner = directMessage.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;

    if (!isMessageOwner && !isAdmin && !isModerator) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return {
      directMessage,
      member,
    };
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }
}
