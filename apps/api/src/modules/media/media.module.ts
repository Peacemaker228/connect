import { Module } from '@nestjs/common';

import { LiveKitMediaProviderAdapter } from './livekit-media-provider.adapter';
import { MediasoupPrototypeService } from './mediasoup-prototype.service';
import { MediaAccessService } from './media-access.service';
import { MediaController } from './media.controller';
import { MediaParticipantSessionService } from './media-participant-session.service';
import { MediaPermissionService } from './media-permission.service';
import { MEDIA_PROVIDER_ADAPTER } from './media-provider.adapter';
import { MediaRoomService } from './media-room.service';
import { TurnCredentialService } from './turn-credential.service';

@Module({
  controllers: [MediaController],
  providers: [
    LiveKitMediaProviderAdapter,
    MediaAccessService,
    MediaRoomService,
    MediaParticipantSessionService,
    MediaPermissionService,
    MediasoupPrototypeService,
    TurnCredentialService,
    {
      provide: MEDIA_PROVIDER_ADAPTER,
      useExisting: LiveKitMediaProviderAdapter,
    },
  ],
})
export class MediaModule {}
