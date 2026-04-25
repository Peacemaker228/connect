import { Body, Controller, Delete, Headers, Param, Patch, Post, Query } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  createChannelCreatedRealtimeEvent,
  createChannelDeletedRealtimeEvent,
  createChannelUpdatedRealtimeEvent,
} from '../realtime/realtime.events';
import { ChannelsService } from './channels.service';

type ChannelMutationBody = {
  name?: string;
  type?: string;
};

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post()
  async createChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('serverId') serverId: string | undefined,
    @Body() body: ChannelMutationBody,
  ) {
    const channel = await this.channelsService.createChannel(profileId, serverId, body);

    if (serverId) {
      this.realtimeGateway.emit(
        createChannelCreatedRealtimeEvent(serverId, {
          name: body.name,
          type: body.type,
        }),
      );
    }

    return channel;
  }

  @Patch(':channelId')
  async updateChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('channelId') channelId: string,
    @Query('serverId') serverId: string | undefined,
    @Body() body: ChannelMutationBody,
  ) {
    const channel = await this.channelsService.updateChannel(profileId, serverId, channelId, body);

    if (serverId) {
      this.realtimeGateway.emit(
        createChannelUpdatedRealtimeEvent(serverId, {
          id: channelId,
          name: body.name,
          type: body.type,
        }),
      );
    }

    return channel;
  }

  @Delete(':channelId')
  async deleteChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('channelId') channelId: string,
    @Query('serverId') serverId: string | undefined,
  ) {
    const channel = await this.channelsService.deleteChannel(profileId, serverId, channelId);

    if (serverId) {
      this.realtimeGateway.emit(createChannelDeletedRealtimeEvent(serverId, channelId));
    }

    return channel;
  }
}
