import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';

import {
  MEDIA_PROVIDER_ADAPTER,
  MediaProviderAdapter,
} from './media-provider.adapter';

@Controller('media')
export class MediaController {
  constructor(
    @Inject(MEDIA_PROVIDER_ADAPTER)
    private readonly mediaProviderAdapter: MediaProviderAdapter,
  ) {}

  @Get('livekit-token')
  async getLiveKitToken(
    @Query('room') room: string | undefined,
    @Query('username') username: string | undefined,
  ) {
    if (!room) {
      throw new BadRequestException('Missing "room" query parameter');
    }

    if (!username) {
      throw new BadRequestException('Missing "username" query parameter');
    }

    return this.mediaProviderAdapter.createRoomAccess({
      room,
      username,
    });
  }
}
