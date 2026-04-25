import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentAuth } from './decorators/current-auth.decorator';
import { AuthContextGuard } from './guards/auth-context.guard';
import { AuthService } from './auth.service';
import type { ApiAuthContext } from './auth.types';

@Controller('auth')
@UseGuards(AuthContextGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  getSession(@CurrentAuth() authContext: ApiAuthContext | undefined) {
    return this.authService.getSessionSnapshot(authContext);
  }
}
