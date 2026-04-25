import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { AuthRequest } from '../auth-request.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthContextGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    request.authContext = await this.authService.getRequestContext(request);

    return true;
  }
}
