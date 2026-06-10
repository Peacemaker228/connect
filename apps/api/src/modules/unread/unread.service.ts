import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';

type UnreadAttentionLevel = 'none' | 'unread' | 'mention' | 'reply';

type ChannelUnreadSummaryItem = {
  channelId: string;
  unreadCount: number;
  mentionCount: number;
  replyCount: number;
  attentionLevel: UnreadAttentionLevel;
};

type ConversationUnreadSummaryItem = {
  conversationId: string;
  memberId: string;
  unreadCount: number;
  mentionCount: number;
  replyCount: number;
  attentionLevel: UnreadAttentionLevel;
};

@Injectable()
export class UnreadService {
  constructor(private readonly prisma: PrismaService) {}

  async getServerUnreadSummary(profileId: string | undefined, serverId: string | undefined) {
    const { currentMember, server } = await this.resolveServerMember(profileId, serverId);
    const defaultReadAt = currentMember.createdAt;

    const channelReadStates = await this.prisma.channelReadState.findMany({
      where: {
        memberId: currentMember.id,
        channelId: {
          in: server.channels.map((channel) => channel.id),
        },
      },
    });
    const conversationReadStates = await this.prisma.conversationReadState.findMany({
      where: {
        memberId: currentMember.id,
        conversationId: {
          in: server.conversations.map((conversation) => conversation.id),
        },
      },
    });

    const channelReadStateByChannelId = new Map(
      channelReadStates.map((readState) => [readState.channelId, readState.lastReadAt]),
    );
    const conversationReadStateByConversationId = new Map(
      conversationReadStates.map((readState) => [readState.conversationId, readState.lastReadAt]),
    );

    const channels: ChannelUnreadSummaryItem[] = await Promise.all(
      server.channels.map(async (channel) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            channelId: channel.id,
            deleted: false,
            memberId: {
              not: currentMember.id,
            },
            createdAt: {
              gt: channelReadStateByChannelId.get(channel.id) ?? defaultReadAt,
            },
          },
        });

        return this.createChannelUnreadSummaryItem(channel.id, unreadCount);
      }),
    );

    const conversations: ConversationUnreadSummaryItem[] = await Promise.all(
      server.conversations.map(async (conversation) => {
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: conversation.id,
            deleted: false,
            memberId: {
              not: currentMember.id,
            },
            createdAt: {
              gt: conversationReadStateByConversationId.get(conversation.id) ?? defaultReadAt,
            },
          },
        });
        const otherMemberId =
          conversation.memberOneId === currentMember.id ? conversation.memberTwoId : conversation.memberOneId;

        return this.createConversationUnreadSummaryItem(conversation.id, otherMemberId, unreadCount);
      }),
    );

    return {
      serverId: server.id,
      channels,
      conversations,
    };
  }

  async markChannelRead(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
  ) {
    const { currentMember } = await this.resolveChannelMember(profileId, serverId, channelId);
    const resolvedChannelId = this.requireValue(channelId, 'Channel ID Missing');

    await this.prisma.channelReadState.upsert({
      where: {
        memberId_channelId: {
          memberId: currentMember.id,
          channelId: resolvedChannelId,
        },
      },
      create: {
        memberId: currentMember.id,
        channelId: resolvedChannelId,
        lastReadAt: new Date(),
      },
      update: {
        lastReadAt: new Date(),
      },
    });

    return {
      channelId: resolvedChannelId,
      unreadCount: 0,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: 'none' as const,
    };
  }

  async markConversationRead(profileId: string | undefined, conversationId: string | undefined) {
    const { conversation, currentMember } = await this.resolveConversationMember(profileId, conversationId);

    await this.prisma.conversationReadState.upsert({
      where: {
        memberId_conversationId: {
          memberId: currentMember.id,
          conversationId: conversation.id,
        },
      },
      create: {
        memberId: currentMember.id,
        conversationId: conversation.id,
        lastReadAt: new Date(),
      },
      update: {
        lastReadAt: new Date(),
      },
    });

    const otherMemberId =
      conversation.memberOneId === currentMember.id ? conversation.memberTwoId : conversation.memberOneId;

    return {
      conversationId: conversation.id,
      memberId: otherMemberId,
      unreadCount: 0,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: 'none' as const,
    };
  }

  private async resolveServerMember(profileId: string | undefined, serverId: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const resolvedServerId = this.requireValue(serverId, 'Server ID Missing');

    const server = await this.prisma.server.findFirst({
      where: {
        id: resolvedServerId,
        members: {
          some: {
            profileId: resolvedProfileId,
          },
        },
      },
      include: {
        channels: {
          where: {
            type: 'TEXT',
          },
          select: {
            id: true,
          },
        },
        members: {
          where: {
            profileId: resolvedProfileId,
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!server) {
      throw new HttpException('Server Not Found', HttpStatus.NOT_FOUND);
    }

    const currentMember = server.members[0];

    if (!currentMember) {
      throw new HttpException('Member Not Found', HttpStatus.NOT_FOUND);
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            memberOneId: currentMember.id,
          },
          {
            memberTwoId: currentMember.id,
          },
        ],
      },
      select: {
        id: true,
        memberOneId: true,
        memberTwoId: true,
      },
    });

    return {
      currentMember,
      server: {
        ...server,
        conversations,
      },
    };
  }

  private async resolveChannelMember(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
  ) {
    const { currentMember, server } = await this.resolveServerMember(profileId, serverId);
    const resolvedChannelId = this.requireValue(channelId, 'Channel ID Missing');
    const channel = server.channels.find((candidate) => candidate.id === resolvedChannelId);

    if (!channel) {
      throw new HttpException('Channel Not Found', HttpStatus.NOT_FOUND);
    }

    return {
      currentMember,
      channel,
    };
  }

  private async resolveConversationMember(profileId: string | undefined, conversationId: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const resolvedConversationId = this.requireValue(conversationId, 'Conversation ID Missing');

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: resolvedConversationId,
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
      include: {
        memberOne: true,
        memberTwo: true,
      },
    });

    if (!conversation) {
      throw new HttpException('Conversation Not Found', HttpStatus.NOT_FOUND);
    }

    const currentMember =
      conversation.memberOne.profileId === resolvedProfileId ? conversation.memberOne : conversation.memberTwo;

    return {
      conversation,
      currentMember,
    };
  }

  private createChannelUnreadSummaryItem(channelId: string, unreadCount: number): ChannelUnreadSummaryItem {
    return {
      channelId,
      unreadCount,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: unreadCount > 0 ? 'unread' : 'none',
    };
  }

  private createConversationUnreadSummaryItem(
    conversationId: string,
    memberId: string,
    unreadCount: number,
  ): ConversationUnreadSummaryItem {
    return {
      conversationId,
      memberId,
      unreadCount,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: unreadCount > 0 ? 'unread' : 'none',
    };
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }

  private requireValue(value: string | undefined, message: string) {
    if (!value) {
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    return value;
  }
}
