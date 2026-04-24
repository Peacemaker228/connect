import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';

import { ServersService } from './servers.service';

type ServerMutationBody = {
  name?: string;
  imageUrl?: string | null;
};

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  createServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Body() body: ServerMutationBody,
  ) {
    return this.serversService.createServer(profileId, body);
  }

  @Get()
  getServers(@Headers('x-profile-id') profileId: string | undefined) {
    return this.serversService.getServers(profileId);
  }

  @Get(':serverId')
  getServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.getServer(profileId, serverId);
  }

  @Patch(':serverId')
  updateServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
    @Body() body: ServerMutationBody,
  ) {
    return this.serversService.updateServer(profileId, serverId, body);
  }

  @Delete(':serverId')
  deleteServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.deleteServer(profileId, serverId);
  }

  @Patch(':serverId/invite-code')
  regenerateInviteCode(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.regenerateInviteCode(profileId, serverId);
  }

  @Patch(':serverId/leave')
  leaveServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.leaveServer(profileId, serverId);
  }
}
