import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import { CurrentAuth } from './decorators/current-auth.decorator';
import { AuthCookiesService, type AuthCookieResponse } from './auth-cookies.service';
import { AuthContextGuard } from './guards/auth-context.guard';
import { AuthService } from './auth.service';
import type {
  ApiAuthContext,
  ApiAuthIdentityPayload,
  ApiAuthPasswordLoginPayload,
  ApiAuthPasswordRegistrationPayload,
} from './auth.types';

@Controller('auth')
@UseGuards(AuthContextGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  @Get('session')
  getSession(@CurrentAuth() authContext: ApiAuthContext | undefined) {
    return this.authService.getSessionSnapshot(authContext);
  }

  @Post('session/exchange')
  async exchangeSession(
    @CurrentAuth() authContext: ApiAuthContext | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const exchangeSnapshot = await this.authService.exchangeSession(authContext, {
      userAgent,
      ipAddress: forwardedFor,
    });

    this.authCookiesService.applyIssuedSessionCookies(
      response,
      exchangeSnapshot.issuedSession,
    );

    return exchangeSnapshot;
  }

  @Post('session/refresh')
  async refreshSession(
    @Body() body: { refreshToken?: string } | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const exchangeSnapshot = await this.authService.refreshSession({
      refreshToken: body?.refreshToken,
      cookieHeader,
      userAgent,
      ipAddress: forwardedFor,
    });

    this.authCookiesService.applyIssuedSessionCookies(
      response,
      exchangeSnapshot.issuedSession,
    );

    return exchangeSnapshot;
  }

  @Post('session/logout')
  async logoutSession(
    @CurrentAuth() authContext: ApiAuthContext | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    await this.authService.logoutSession(authContext);
    this.authCookiesService.clearSessionCookies(response);

    return { ok: true };
  }

  @Post('register/password')
  async registerPasswordIdentity(
    @Body() body: ApiAuthPasswordRegistrationPayload,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const exchangeSnapshot = await this.authService.registerPasswordIdentity(
      body,
      {
        userAgent,
        ipAddress: forwardedFor,
      },
    );

    this.authCookiesService.applyIssuedSessionCookies(
      response,
      exchangeSnapshot.issuedSession,
    );

    return exchangeSnapshot;
  }

  @Post('login/password')
  async loginWithPassword(
    @Body() body: ApiAuthPasswordLoginPayload,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const exchangeSnapshot = await this.authService.loginWithPassword(body, {
      userAgent,
      ipAddress: forwardedFor,
    });

    this.authCookiesService.applyIssuedSessionCookies(
      response,
      exchangeSnapshot.issuedSession,
    );

    return exchangeSnapshot;
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
