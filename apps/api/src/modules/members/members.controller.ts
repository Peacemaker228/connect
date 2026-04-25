import { Body, Controller, Delete, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  createMemberDeletedRealtimeEvent,
  createMemberRoleUpdatedRealtimeEvent,
} from '../realtime/realtime.events';
import { MembersService } from './members.service';

type MemberRoleBody = {
  role?: string;
};

@Controller('members')
@UseGuards(RequireAuthGuard)
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Patch(':memberId')
  async updateMemberRole(
    @CurrentProfileId() profileId: string,
    @Param('memberId') memberId: string,
    @Query('serverId') serverId: string | undefined,
    @Body() body: MemberRoleBody,
  ) {
    const member = await this.membersService.updateMemberRole(profileId, serverId, memberId, body.role);

    if (serverId) {
      this.realtimeGateway.emit(createMemberRoleUpdatedRealtimeEvent(serverId, memberId));
    }

    return member;
  }

  @Delete(':memberId')
  async deleteMember(
    @CurrentProfileId() profileId: string,
    @Param('memberId') memberId: string,
    @Query('serverId') serverId: string | undefined,
  ) {
    const member = await this.membersService.deleteMember(profileId, serverId, memberId);

    if (serverId) {
      this.realtimeGateway.emit(createMemberDeletedRealtimeEvent(serverId, memberId));
    }

    return member;
  }
}
