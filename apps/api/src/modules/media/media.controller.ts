import { BadRequestException, Controller, Get, InternalServerErrorException, Query } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Controller('media')
export class MediaController {
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

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new InternalServerErrorException('Server misconfigured');
    }

    const accessToken = new AccessToken(apiKey, apiSecret, { identity: username });

    accessToken.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await accessToken.toJwt(),
    };
  }
}
