import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { randomUUID } from 'crypto';

import { GENERAL_CHANNEL_NAME } from '../../common/constants/domain.constants';
import { PrismaService } from '../../common/database/prisma.service';
import { StorageService } from '../storage/storage.service';

type ServerMutationBody = {
  name?: string;
  imageUrl?: string | null;
};

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createServer(profileId: string | undefined, body: ServerMutationBody) {
    const resolvedProfileId = this.requireProfileId(profileId);
    const { name, imageUrl } = body;

    if (!name) {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }

    const finalizedImageUrl =
      typeof imageUrl === 'string'
        ? await this.storageService.finalizeStoredValue(resolvedProfileId, 'serverImage', imageUrl)
        : imageUrl;

    return this.prisma.server.create({
      data: {
        profileId: resolvedProfileId,
        name,
        imageUrl: typeof finalizedImageUrl === 'string' ? finalizedImageUrl : '',
        inviteCode: randomUUID(),
        channels: {
          create: [
            {
              name: GENERAL_CHANNEL_NAME,
              profileId: resolvedProfileId,
              type: 'TEXT',
            },
          ],
        },
        members: {
          create: [
            {
              profileId: resolvedProfileId,
              role: MemberRole.ADMIN,
            },
          ],
        },
      },
    });
  }

  async getServers(profileId: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId);

    return this.prisma.server.findMany({
      where: {
        members: {
          some: {
            profileId: resolvedProfileId,
          },
        },
      },
    });
  }

  async getServer(profileId: string | undefined, serverId: string) {
    this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    const server = await this.prisma.server.findUnique({
      where: {
        id: serverId,
      },
      include: {
        channels: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        members: {
          include: {
            profile: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async updateServer(profileId: string | undefined, serverId: string, body: ServerMutationBody) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    const finalizedImageUrl =
      typeof body.imageUrl === 'string'
        ? await this.storageService.finalizeStoredValue(resolvedProfileId, 'serverImage', body.imageUrl)
        : body.imageUrl;

    return this.prisma.server.update({
      where: {
        id: serverId,
        profileId: resolvedProfileId,
      },
      data: {
        name: body.name,
        imageUrl: typeof finalizedImageUrl === 'string' ? finalizedImageUrl : undefined,
      },
    });
  }

  async deleteServer(profileId: string | undefined, serverId: string) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.delete({
      where: {
        id: serverId,
        profileId: resolvedProfileId,
      },
    });
  }

  async regenerateInviteCode(profileId: string | undefined, serverId: string) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        profileId: resolvedProfileId,
      },
      data: {
        inviteCode: randomUUID(),
      },
    });
  }

  async leaveServer(profileId: string | undefined, serverId: string) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        profileId: {
          not: resolvedProfileId,
        },
        members: {
          some: {
            profileId: resolvedProfileId,
          },
        },
      },
      data: {
        members: {
          deleteMany: {
            profileId: resolvedProfileId,
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
}
