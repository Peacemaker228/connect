import { Module } from '@nestjs/common';

import { AuthCookiesService } from './auth-cookies.service';
import { AuthController } from './auth.controller';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthService } from './auth.service';
import { AuthTokensService } from './auth-tokens.service';
import { AuthContextGuard } from './guards/auth-context.guard';
import { RequireAuthGuard } from './guards/require-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokensService,
    AuthSessionsService,
    AuthCookiesService,
    AuthContextGuard,
    RequireAuthGuard,
  ],
  exports: [
    AuthService,
    AuthTokensService,
    AuthSessionsService,
    AuthCookiesService,
    AuthContextGuard,
    RequireAuthGuard,
  ],
})
export class AuthModule {}
