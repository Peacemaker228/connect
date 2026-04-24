import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChannelType, MemberRole } from '@prisma/client';

import { GENERAL_CHANNEL_NAME } from '../../common/constants/domain.constants';
import { PrismaService } from '../../common/database/prisma.service';

type ChannelMutationBody = {
  name?: string;
  type?: string;
};

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChannel(
    profileId: string | undefined,
    serverId: string | undefined,
    body: ChannelMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!body.name) {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }

    if (!body.type) {
      throw new HttpException('Type is required', HttpStatus.BAD_REQUEST);
    }

    const channelType = this.parseChannelType(body.type);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (body.name === GENERAL_CHANNEL_NAME) {
      throw new HttpException('Name cannot be "general"', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: resolvedProfileId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: resolvedProfileId,
            name: body.name,
            type: channelType,
          },
        },
      },
    });
  }

  async updateChannel(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string,
    body: ChannelMutationBody,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!body.name || !body.type) {
      throw new HttpException('Name and Type are required', HttpStatus.BAD_REQUEST);
    }

    const channelType = this.parseChannelType(body.type);

    if (body.name === GENERAL_CHANNEL_NAME) {
      throw new HttpException('Name cannot be "general"', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: resolvedProfileId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
              NOT: {
                name: GENERAL_CHANNEL_NAME,
              },
            },
            data: {
              name: body.name,
              type: channelType,
            },
          },
        },
      },
    });
  }

  async deleteChannel(
    profileId: string | undefined,
    serverId: string | undefined,
    channelId: string,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!channelId) {
      throw new HttpException('Channel ID Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: resolvedProfileId,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            },
          },
        },
      },
      data: {
        channels: {
          delete: {
            id: channelId,
            name: {
              not: GENERAL_CHANNEL_NAME,
            },
          },
        },
      },
    });
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }

  private parseChannelType(type: string) {
    if (!Object.values(ChannelType).includes(type as ChannelType)) {
      throw new HttpException('Type is invalid', HttpStatus.BAD_REQUEST);
    }

    return type as ChannelType;
  }
}
