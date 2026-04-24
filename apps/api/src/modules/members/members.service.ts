import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMemberRole(
    profileId: string | undefined,
    serverId: string | undefined,
    memberId: string,
    role: string | undefined,
  ) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!memberId) {
      throw new HttpException('Member ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!role) {
      throw new HttpException('Role is required', HttpStatus.BAD_REQUEST);
    }

    const memberRole = this.parseMemberRole(role);

    return this.prisma.server.update({
      where: {
        id: serverId,
        profileId: resolvedProfileId,
      },
      data: {
        members: {
          update: {
            where: {
              id: memberId,
              profileId: {
                not: resolvedProfileId,
              },
            },
            data: {
              role: memberRole,
            },
          },
        },
      },
      include: {
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
  }

  async deleteMember(profileId: string | undefined, serverId: string | undefined, memberId: string) {
    const resolvedProfileId = this.requireProfileId(profileId);

    if (!serverId) {
      throw new HttpException('Server ID Missing', HttpStatus.BAD_REQUEST);
    }

    if (!memberId) {
      throw new HttpException('Member ID Missing', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.server.update({
      where: {
        id: serverId,
        profileId: resolvedProfileId,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            profileId: {
              not: resolvedProfileId,
            },
          },
        },
      },
      include: {
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
  }

  private requireProfileId(profileId: string | undefined) {
    if (!profileId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return profileId;
  }

  private parseMemberRole(role: string) {
    if (!Object.values(MemberRole).includes(role as MemberRole)) {
      throw new HttpException('Role is invalid', HttpStatus.BAD_REQUEST);
    }

    return role as MemberRole;
  }
}
