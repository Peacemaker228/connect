import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { createMemberLeftRealtimeEvent } from '../realtime/realtime.events';
import { ServersService } from './servers.service';

type ServerMutationBody = {
  name?: string;
  imageUrl?: string | null;
};

@Controller('servers')
@UseGuards(RequireAuthGuard)
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post()
  createServer(
    @CurrentProfileId() profileId: string,
    @Body() body: ServerMutationBody,
  ) {
    return this.serversService.createServer(profileId, body);
  }

  @Get()
  getServers(@CurrentProfileId() profileId: string) {
    return this.serversService.getServers(profileId);
  }

  @Get(':serverId')
  getServer(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.getServer(profileId, serverId);
  }

  @Patch(':serverId')
  updateServer(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
    @Body() body: ServerMutationBody,
  ) {
    return this.serversService.updateServer(profileId, serverId, body);
  }

  @Delete(':serverId')
  deleteServer(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.deleteServer(profileId, serverId);
  }

  @Patch(':serverId/invite-code')
  regenerateInviteCode(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.serversService.regenerateInviteCode(profileId, serverId);
  }

  @Patch(':serverId/leave')
  async leaveServer(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
  ) {
    const server = await this.serversService.leaveServer(profileId, serverId);

    this.realtimeGateway.emit(createMemberLeftRealtimeEvent(serverId, profileId));

    return server;
  }
}
