import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { createMemberAddedRealtimeEvent } from '../realtime/realtime.events';
import { InvitesService } from './invites.service';

type JoinInviteBody = {
  inviteCode?: string;
};

@Controller('invites')
@UseGuards(RequireAuthGuard)
export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post('join')
  async joinInvite(
    @CurrentProfileId() profileId: string,
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
