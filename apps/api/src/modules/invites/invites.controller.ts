import { Body, Controller, Headers, Post } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';
import { createMemberAddedRealtimeEvent } from '../realtime/realtime.events';
import { InvitesService } from './invites.service';

type JoinInviteBody = {
  inviteCode?: string;
};

@Controller('invites')
export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post('join')
  async joinInvite(
    @Headers('x-profile-id') profileId: string | undefined,
    @Body() body: JoinInviteBody,
  ) {
    const result = await this.invitesService.joinInvite(profileId, body.inviteCode);
    const serverId = result.redirectUrl.split('/').filter(Boolean).at(-1);

    if (serverId) {
      this.realtimeGateway.emit(createMemberAddedRealtimeEvent(serverId));
    }

    return result;
  }
}
