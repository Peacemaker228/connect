import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

import {
  CreateMediaRoomAccessInput,
  MediaProviderAdapter,
  MediaRoomAccessResponse,
} from './media-provider.adapter';

@Injectable()
export class LiveKitMediaProviderAdapter implements MediaProviderAdapter {
  async createRoomAccess({
    room,
    username,
  }: CreateMediaRoomAccessInput): Promise<MediaRoomAccessResponse> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new InternalServerErrorException('Server misconfigured');
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });

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
