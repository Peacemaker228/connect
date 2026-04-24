import { Body, Controller, Delete, Headers, Param, Patch, Post, Query } from '@nestjs/common';

import { ChannelsService } from './channels.service';

type ChannelMutationBody = {
  name?: string;
  type?: string;
};

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  createChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('serverId') serverId: string | undefined,
    @Body() body: ChannelMutationBody,
  ) {
    return this.channelsService.createChannel(profileId, serverId, body);
  }

  @Patch(':channelId')
  updateChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('channelId') channelId: string,
    @Query('serverId') serverId: string | undefined,
    @Body() body: ChannelMutationBody,
  ) {
    return this.channelsService.updateChannel(profileId, serverId, channelId, body);
  }

  @Delete(':channelId')
  deleteChannel(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('channelId') channelId: string,
    @Query('serverId') serverId: string | undefined,
  ) {
    return this.channelsService.deleteChannel(profileId, serverId, channelId);
  }
}
