import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';

import { CurrentAuth } from './decorators/current-auth.decorator';
import { AuthContextGuard } from './guards/auth-context.guard';
import { AuthService } from './auth.service';
import type { ApiAuthContext, ApiAuthIdentityPayload } from './auth.types';

@Controller('auth')
@UseGuards(AuthContextGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  getSession(@CurrentAuth() authContext: ApiAuthContext | undefined) {
    return this.authService.getSessionSnapshot(authContext);
  }

  @Post('session/resolve')
  resolveSession(
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() body: { identity?: ApiAuthIdentityPayload } | undefined,
  ) {
    return this.authService.resolveSessionFromIdentity({
      userId,
      sessionId,
      identity: body?.identity,
    });
  }
}
