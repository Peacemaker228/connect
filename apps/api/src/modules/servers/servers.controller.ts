import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';
import { createMemberLeftRealtimeEvent } from '../realtime/realtime.events';
import { ServersService } from './servers.service';

type ServerMutationBody = {
  name?: string;
  imageUrl?: string | null;
};

@Controller('servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

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
  async leaveServer(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('serverId') serverId: string,
  ) {
    const server = await this.serversService.leaveServer(profileId, serverId);

    if (profileId) {
      this.realtimeGateway.emit(createMemberLeftRealtimeEvent(serverId, profileId));
    }

    return server;
  }
}
