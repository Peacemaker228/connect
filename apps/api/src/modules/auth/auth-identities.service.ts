import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthIdentityProvider, type Profile } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../common/database/prisma.service';
import type {
  ApiAuthIdentityPayload,
  ApiAuthPasswordLoginPayload,
  ApiAuthPasswordRegistrationPayload,
} from './auth.types';
import { AuthPasswordsService } from './auth-passwords.service';

@Injectable()
export class AuthIdentitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authPasswordsService: AuthPasswordsService,
  ) {}

  async resolveClerkIdentity(params: {
    userId: string;
    identity?: ApiAuthIdentityPayload;
  }): Promise<Profile> {
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_subject: {
          provider: AuthIdentityProvider.CLERK,
          subject: params.userId,
        },
      },
      include: {
        profile: true,
      },
    });

    if (existingIdentity) {
      await this.touchIdentity(existingIdentity.id, params.identity);
      return existingIdentity.profile;
    }

    const legacyProfile = await this.prisma.profile.findUnique({
      where: {
        userId: params.userId,
      },
    });

    if (legacyProfile) {
      await this.prisma.authIdentity.upsert({
        where: {
          provider_subject: {
            provider: AuthIdentityProvider.CLERK,
            subject: params.userId,
          },
        },
        update: this.getClerkIdentityUpdate(params.identity),
        create: {
          provider: AuthIdentityProvider.CLERK,
          subject: params.userId,
          profileId: legacyProfile.id,
          ...this.getClerkIdentityCreate(params.identity),
        },
      });

      return legacyProfile;
    }

    if (!params.identity) {
      throw new NotFoundException('Profile not found');
    }

    const identity = params.identity;

    return this.prisma.$transaction(async (tx) => {
      const createdProfile = await tx.profile.create({
        data: {
          userId: params.userId,
          name: this.getProfileName(identity),
          imageUrl: identity.imageUrl ?? '',
          email: identity.primaryEmailAddress ?? '',
        },
      });

      await tx.authIdentity.create({
        data: {
          provider: AuthIdentityProvider.CLERK,
          subject: params.userId,
          profileId: createdProfile.id,
          ...this.getClerkIdentityCreate(identity),
        },
      });

      return createdProfile;
    });
  }

  async registerPasswordIdentity(
    payload: ApiAuthPasswordRegistrationPayload,
  ): Promise<Profile> {
    const email = this.normalizeEmail(payload.email);
    const password = this.normalizePassword(payload.password);
    const profileName = this.normalizeProfileName(payload.name, email);

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_subject: {
          provider: AuthIdentityProvider.PASSWORD,
          subject: email,
        },
      },
    });

    if (existingIdentity) {
      throw new ConflictException('Identity already exists');
    }

    const passwordHash = this.authPasswordsService.hashPassword(password);

    return this.prisma.$transaction(async (tx) => {
      const createdProfile = await tx.profile.create({
        data: {
          userId: randomUUID(),
          name: profileName,
          imageUrl: '',
          email,
        },
      });

      const createdIdentity = await tx.authIdentity.create({
        data: {
          provider: AuthIdentityProvider.PASSWORD,
          subject: email,
          profileId: createdProfile.id,
          email,
          emailNormalized: email,
          lastAuthenticatedAt: new Date(),
        },
      });

      await tx.authPasswordCredential.create({
        data: {
          identityId: createdIdentity.id,
          passwordHash,
        },
      });

      return createdProfile;
    });
  }

  async authenticatePasswordIdentity(
    payload: ApiAuthPasswordLoginPayload,
  ): Promise<Profile> {
    const email = this.normalizeEmail(payload.email);
    const password = this.normalizePassword(payload.password);
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_subject: {
          provider: AuthIdentityProvider.PASSWORD,
          subject: email,
        },
      },
      include: {
        profile: true,
        passwordCredential: true,
      },
    });

    if (!existingIdentity?.passwordCredential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = this.authPasswordsService.verifyPassword(
      password,
      existingIdentity.passwordCredential.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.authIdentity.update({
      where: {
        id: existingIdentity.id,
      },
      data: {
        lastAuthenticatedAt: new Date(),
      },
    });

    return existingIdentity.profile;
  }

  private async touchIdentity(
    identityId: string,
    identity: ApiAuthIdentityPayload | undefined,
  ) {
    await this.prisma.authIdentity.update({
      where: {
        id: identityId,
      },
      data: this.getClerkIdentityUpdate(identity),
    });
  }

  private getClerkIdentityCreate(identity: ApiAuthIdentityPayload | undefined) {
    const email = identity?.primaryEmailAddress
      ? this.normalizeEmailAddress(identity.primaryEmailAddress)
      : null;

    return {
      email,
      emailNormalized: email,
      lastAuthenticatedAt: new Date(),
    };
  }

  private getClerkIdentityUpdate(identity: ApiAuthIdentityPayload | undefined) {
    if (!identity) {
      return {
        lastAuthenticatedAt: new Date(),
      };
    }

    const email = identity?.primaryEmailAddress
      ? this.normalizeEmailAddress(identity.primaryEmailAddress)
      : null;

    return {
      email,
      emailNormalized: email,
      lastAuthenticatedAt: new Date(),
    };
  }

  private normalizeEmail(value: string) {
    const normalizedEmail = this.normalizeEmailAddress(value);

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    return normalizedEmail;
  }

  private normalizeEmailAddress(value: string | null | undefined) {
    const normalizedEmail = value?.trim().toLowerCase();

    return normalizedEmail && normalizedEmail.length > 0 ? normalizedEmail : null;
  }

  private normalizePassword(password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (password.length > 128) {
      throw new BadRequestException('Password is too long');
    }

    return password;
  }

  private normalizeProfileName(name: string | null | undefined, email: string) {
    const normalizedName = name?.trim();

    if (normalizedName) {
      return normalizedName;
    }

    const [emailName] = email.split('@');

    if (emailName?.trim()) {
      return emailName.trim();
    }

    throw new BadRequestException('Profile name is required');
  }

  private getProfileName(identity: ApiAuthIdentityPayload) {
    if (identity.firstName && identity.lastName) {
      return `${identity.firstName} ${identity.lastName}`;
    }

    if (identity.firstName) {
      return identity.firstName;
    }

    if (identity.lastName) {
      return identity.lastName;
    }

    if (identity.username) {
      return identity.username;
    }

    if (identity.primaryEmailAddress) {
      const normalizedEmail = this.normalizeEmailAddress(
        identity.primaryEmailAddress,
      );
      const [emailName] = normalizedEmail?.split('@') ?? [];

      if (emailName?.trim()) {
        return emailName.trim();
      }
    }

    return 'USER';
  }
}
