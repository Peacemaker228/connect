import { Body, Controller, Delete, Headers, Param, Patch, Query } from '@nestjs/common';

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
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Patch(':memberId')
  async updateMemberRole(
    @Headers('x-profile-id') profileId: string | undefined,
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
    @Headers('x-profile-id') profileId: string | undefined,
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
