import { Body, Controller, Headers, Post } from '@nestjs/common';

import { InvitesService } from './invites.service';

type JoinInviteBody = {
  inviteCode?: string;
};

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('join')
  joinInvite(
    @Headers('x-profile-id') profileId: string | undefined,
    @Body() body: JoinInviteBody,
  ) {
    return this.invitesService.joinInvite(profileId, body.inviteCode);
  }
}
