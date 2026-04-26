import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthIdentityProvider, type Profile } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../common/database/prisma.service';
import type {
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
}
