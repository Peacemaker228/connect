import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';

type UnreadAttentionLevel = 'none' | 'unread' | 'mention' | 'reply';

type ChannelUnreadSummaryItem = {
  channelId: string;
  lastReadAt: Date;
  unreadCount: number;
  mentionCount: number;
  replyCount: number;
  attentionLevel: UnreadAttentionLevel;
};

type ConversationUnreadSummaryItem = {
  conversationId: string;
  memberId: string;
  lastReadAt: Date;
  unreadCount: number;
  mentionCount: number;
  replyCount: number;
  attentionLevel: UnreadAttentionLevel;
};

type GlobalServerUnreadSummaryItem = {
  serverId: string;
  memberId: string;
  unreadCount: number;
  mentionCount: number;
  replyCount: number;
  attentionLevel: UnreadAttentionLevel;
};

@Injectable()
export class UnreadService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalUnreadSummary(profileId: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId);

    const servers = await this.prisma.server.findMany({
      where: {
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

    const serverSummaries = await Promise.all(
      servers.map(async (server) => {
        const currentMember = server.members[0];

        if (!currentMember) {
          return null;
        }

        const conversations = await this.findConversationsForMember(currentMember.id, server.id);
        const unreadSummary = await this.createUnreadSummaryForServerMember(
          {
            ...server,
            conversations,
          },
          currentMember,
        );

        return this.createGlobalServerUnreadSummaryItem(server.id, currentMember.id, unreadSummary);
      }),
    );
    const serversWithUnread = serverSummaries.filter((summary): summary is GlobalServerUnreadSummaryItem =>
      Boolean(summary),
    );

    return {
      totalUnreadCount: serversWithUnread.reduce((total, server) => total + server.unreadCount, 0),
      servers: serversWithUnread,
    };
  }

  async getServerUnreadSummary(profileId: string | undefined, serverId: string | undefined) {
    const { currentMember, server } = await this.resolveServerMember(profileId, serverId);
    const unreadSummary = await this.createUnreadSummaryForServerMember(server, currentMember);

    return {
      serverId: server.id,
      ...unreadSummary,
    };
  }

  async markChannelRead(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string | undefined,
  ) {
    const { currentMember } = await this.resolveChannelMember(profileId, serverId, channelId);
    const resolvedChannelId = this.requireValue(channelId, 'Channel ID Missing');
    const lastReadAt = new Date();

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
        lastReadAt,
      },
      update: {
        lastReadAt,
      },
    });

    return {
      channelId: resolvedChannelId,
      lastReadAt,
      unreadCount: 0,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: 'none' as const,
    };
  }

  async markConversationRead(profileId: string | undefined, conversationId: string | undefined) {
    const { conversation, currentMember } = await this.resolveConversationMember(profileId, conversationId);
    const lastReadAt = new Date();

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
        lastReadAt,
      },
      update: {
        lastReadAt,
      },
    });

    const otherMemberId =
      conversation.memberOneId === currentMember.id ? conversation.memberTwoId : conversation.memberOneId;

    return {
      conversationId: conversation.id,
      memberId: otherMemberId,
      lastReadAt,
      unreadCount: 0,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: 'none' as const,
    };
  }

  private async createUnreadSummaryForServerMember(
    server: {
      id: string;
      channels: { id: string }[];
      conversations: { id: string; memberOneId: string; memberTwoId: string }[];
    },
    currentMember: { id: string; createdAt: Date },
  ) {
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
        const lastReadAt = channelReadStateByChannelId.get(channel.id) ?? defaultReadAt;
        const unreadCount = await this.prisma.message.count({
          where: {
            channelId: channel.id,
            deleted: false,
            memberId: {
              not: currentMember.id,
            },
            createdAt: {
              gt: lastReadAt,
            },
          },
        });

        return this.createChannelUnreadSummaryItem(channel.id, unreadCount, lastReadAt);
      }),
    );

    const conversations: ConversationUnreadSummaryItem[] = await Promise.all(
      server.conversations.map(async (conversation) => {
        const lastReadAt = conversationReadStateByConversationId.get(conversation.id) ?? defaultReadAt;
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: conversation.id,
            deleted: false,
            memberId: {
              not: currentMember.id,
            },
            createdAt: {
              gt: lastReadAt,
            },
          },
        });
        const otherMemberId =
          conversation.memberOneId === currentMember.id ? conversation.memberTwoId : conversation.memberOneId;

        return this.createConversationUnreadSummaryItem(conversation.id, otherMemberId, unreadCount, lastReadAt);
      }),
    );

    return {
      channels,
      conversations,
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

    const conversations = await this.findConversationsForMember(currentMember.id, server.id);

    return {
      currentMember,
      server: {
        ...server,
        conversations,
      },
    };
  }

  private findConversationsForMember(memberId: string, serverId: string) {
    return this.prisma.conversation.findMany({
      where: {
        memberOne: {
          serverId,
        },
        memberTwo: {
          serverId,
        },
        OR: [
          {
            memberOneId: memberId,
          },
          {
            memberTwoId: memberId,
          },
        ],
      },
      select: {
        id: true,
        memberOneId: true,
        memberTwoId: true,
      },
    });
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

  private createChannelUnreadSummaryItem(
    channelId: string,
    unreadCount: number,
    lastReadAt: Date,
  ): ChannelUnreadSummaryItem {
    return {
      channelId,
      lastReadAt,
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
    lastReadAt: Date,
  ): ConversationUnreadSummaryItem {
    return {
      conversationId,
      memberId,
      lastReadAt,
      unreadCount,
      mentionCount: 0,
      replyCount: 0,
      attentionLevel: unreadCount > 0 ? 'unread' : 'none',
    };
  }

  private createGlobalServerUnreadSummaryItem(
    serverId: string,
    memberId: string,
    summary: { channels: ChannelUnreadSummaryItem[]; conversations: ConversationUnreadSummaryItem[] },
  ): GlobalServerUnreadSummaryItem {
    const unreadCount = [...summary.channels, ...summary.conversations].reduce(
      (total, item) => total + item.unreadCount,
      0,
    );
    const mentionCount = [...summary.channels, ...summary.conversations].reduce(
      (total, item) => total + item.mentionCount,
      0,
    );
    const replyCount = [...summary.channels, ...summary.conversations].reduce(
      (total, item) => total + item.replyCount,
      0,
    );

    return {
      serverId,
      memberId,
      unreadCount,
      mentionCount,
      replyCount,
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
