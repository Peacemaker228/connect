import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelType, MemberRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import type {
  MediaParticipantIdentity,
  MediaRoomMode,
  MediaRoomScope,
} from '../../../../../packages/app-core/src/contracts';

export type ResolvedMediaRoomAccess = {
  roomId: string;
  scope: MediaRoomScope;
  mode: MediaRoomMode;
  displayName: string;
  identity: MediaParticipantIdentity;
  channelType?: ChannelType;
  memberRole?: MemberRole;
};

@Injectable()
export class MediaAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveRoomAccess(
    profileId: string | undefined,
    scope: MediaRoomScope | undefined,
    mode: MediaRoomMode | undefined,
  ): Promise<ResolvedMediaRoomAccess> {
    if (!profileId) {
      throw new ForbiddenException('Authentication is required');
    }

    if (!scope) {
      throw new BadRequestException('Media room scope is required');
    }

    if (scope.kind === 'channel') {
      return this.resolveChannelAccess(profileId, scope, mode);
    }

    if (scope.kind === 'conversation') {
      return this.resolveConversationAccess(profileId, scope, mode);
    }

    return this.resolveMeetingAccess(profileId, scope, mode);
  }

  private async resolveChannelAccess(
    profileId: string,
    scope: Extract<MediaRoomScope, { kind: 'channel' }>,
    mode: MediaRoomMode | undefined,
  ): Promise<ResolvedMediaRoomAccess> {
    if (!scope.serverId || !scope.channelId) {
      throw new BadRequestException('Channel media scope requires serverId and channelId');
    }

    const [channel, member] = await Promise.all([
      this.prisma.channel.findFirst({
        where: {
          id: scope.channelId,
          serverId: scope.serverId,
        },
      }),
      this.prisma.member.findFirst({
        where: {
          serverId: scope.serverId,
          profileId,
        },
        include: {
          profile: true,
        },
      }),
    ]);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!member) {
      throw new ForbiddenException('Channel membership is required');
    }

    if (channel.type === ChannelType.TEXT) {
      throw new BadRequestException('Channel is not media-enabled');
    }

    return {
      roomId: `channel:${scope.serverId}:${scope.channelId}`,
      scope,
      mode: mode ?? 'persistent-channel',
      displayName: channel.name,
      identity: {
        profileId,
        memberId: member.id,
        displayName: member.profile.name,
      },
      channelType: channel.type,
      memberRole: member.role,
    };
  }

  private async resolveConversationAccess(
    profileId: string,
    scope: Extract<MediaRoomScope, { kind: 'conversation' }>,
    mode: MediaRoomMode | undefined,
  ): Promise<ResolvedMediaRoomAccess> {
    if (!scope.serverId || !scope.conversationId) {
      throw new BadRequestException('Conversation media scope requires serverId and conversationId');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: scope.conversationId,
        OR: [
          {
            memberOne: {
              serverId: scope.serverId,
              profileId,
            },
          },
          {
            memberTwo: {
              serverId: scope.serverId,
              profileId,
            },
          },
        ],
      },
      include: {
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
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Conversation membership is required');
    }

    const member =
      conversation.memberOne.profileId === profileId
        ? conversation.memberOne
        : conversation.memberTwo;

    return {
      roomId: `conversation:${scope.serverId}:${scope.conversationId}`,
      scope,
      mode: mode ?? 'private-call',
      displayName: 'Private call',
      identity: {
        profileId,
        memberId: member.id,
        displayName: member.profile.name,
      },
      memberRole: member.role,
    };
  }

  private async resolveMeetingAccess(
    profileId: string,
    scope: Extract<MediaRoomScope, { kind: 'meeting' }>,
    mode: MediaRoomMode | undefined,
  ): Promise<ResolvedMediaRoomAccess> {
    if (!scope.meetingId) {
      throw new BadRequestException('Meeting media scope requires meetingId');
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      throw new ForbiddenException('Profile is required');
    }

    return {
      roomId: `meeting:${scope.meetingId}`,
      scope,
      mode: mode ?? 'meeting',
      displayName: 'Meeting',
      identity: {
        profileId,
        displayName: profile.name,
      },
    };
  }
}
