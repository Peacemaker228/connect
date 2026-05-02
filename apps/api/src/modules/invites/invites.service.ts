import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async validateInvite(inviteCode: string | undefined) {
    if (!inviteCode) {
      return {
        isValidInvite: false,
      };
    }

    const server = await this.prisma.server.findUnique({
      where: {
        inviteCode,
      },
      select: {
        id: true,
      },
    });

    return {
      isValidInvite: Boolean(server),
    };
  }

  async joinInvite(profileId: string | undefined, inviteCode: string | undefined) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!inviteCode) {
      throw new HttpException({ redirectUrl: '/' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const server = await this.prisma.server.update({
        where: {
          inviteCode,
        },
        data: {
          members: {
            create: {
              profileId: resolvedProfileId,
            },
          },
        },
      });

      return {
        redirectUrl: `/servers/${server.id}`,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingServer = await this.prisma.server.findFirst({
          where: {
            inviteCode,
            members: {
              some: {
                profileId: resolvedProfileId,
              },
            },
          },
        });

        if (existingServer) {
          return {
            redirectUrl: `/servers/${existingServer.id}`,
          };
        }

        throw new HttpException({ redirectUrl: '/' }, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException({ redirectUrl: '/' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }
}
