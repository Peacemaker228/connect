import { Body, Controller, Delete, Headers, Param, Patch, Query } from '@nestjs/common';

import { MembersService } from './members.service';

type MemberRoleBody = {
  role?: string;
};

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Patch(':memberId')
  updateMemberRole(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('memberId') memberId: string,
    @Query('serverId') serverId: string | undefined,
    @Body() body: MemberRoleBody,
  ) {
    return this.membersService.updateMemberRole(profileId, serverId, memberId, body.role);
  }

  @Delete(':memberId')
  deleteMember(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('memberId') memberId: string,
    @Query('serverId') serverId: string | undefined,
  ) {
    return this.membersService.deleteMember(profileId, serverId, memberId);
  }
}
