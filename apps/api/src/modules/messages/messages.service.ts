import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';

type MessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

const MESSAGE_BATCH_SIZE = 10;
const MESSAGE_INCLUDE = {
  member: {
    include: {
      profile: true,
    },
  },
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(
    profileId: string | undefined,
    channelId: string | undefined,
    cursor: string | undefined,
  ) {
    this.requireProfileId(profileId);

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST);
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
    });

    return {
      items: messages,
      nextCursor: messages.length === MESSAGE_BATCH_SIZE ? messages[MESSAGE_BATCH_SIZE - 1].id : null,
    };
  }

  async createMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    body: MessageMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!body.content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST);
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
        members: true,
      },
    });

    if (!server) {
      throw new HttpException('Server Not Found', HttpStatus.NOT_FOUND);
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    });

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND);
    }

    const member = server.members.find((candidate) => candidate.profileId === resolvedProfileId);

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.message.create({
      data: {
        content: body.content,
        fileUrl: body.fileUrl,
        channelId,
        memberId: member.id,
      },
      include: MESSAGE_INCLUDE,
    });
  }

  async updateMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
    body: MessageMutationBody,
  ) {
    const { member, message } = await this.resolveMessageMutationAccess(profileId, serverId, channelId, messageId);

    const isMessageOwner = message.memberId === member.id;

    if (!isMessageOwner) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.content) {
      throw new HttpException('Content Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: body.content,
      },
      include: MESSAGE_INCLUDE,
    });
  }

  async deleteMessage(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
  ) {
    await this.resolveMessageMutationAccess(profileId, serverId, channelId, messageId);

    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        fileUrl: null,
        content: 'This message has been deleted.',
        deleted: true,
      },
      include: MESSAGE_INCLUDE,
    });
  }

  private async resolveMessageMutationAccess(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
    messageId: string,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!messageId) {
      throw new HttpException('Message ID Missing', HttpStatus.BAD_REQUEST);
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
        members: true,
      },
    });

    if (!server) {
      throw new HttpException('Server Not Found', HttpStatus.NOT_FOUND);
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    });

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND);
    }

    const member = server.members.find((candidate) => candidate.profileId === resolvedProfileId);

    if (!member) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND);
    }

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
      },
      include: MESSAGE_INCLUDE,
    });

    if (!message || message.deleted) {
      throw new HttpException('Message Not Found', HttpStatus.NOT_FOUND);
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;

    if (!isMessageOwner && !isAdmin && !isModerator) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return {
      member,
      message,
    };
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }
}
