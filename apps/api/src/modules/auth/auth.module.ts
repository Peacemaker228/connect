import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokensService } from './auth-tokens.service';
import { AuthContextGuard } from './guards/auth-context.guard';
import { RequireAuthGuard } from './guards/require-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTokensService, AuthContextGuard, RequireAuthGuard],
  exports: [AuthService, AuthTokensService, AuthContextGuard, RequireAuthGuard],
})
export class AuthModule {}
