import { Module } from '@nestjs/common';

import { LiveKitMediaProviderAdapter } from './livekit-media-provider.adapter';
import { MediaController } from './media.controller';
import { MEDIA_PROVIDER_ADAPTER } from './media-provider.adapter';

@Module({
  controllers: [MediaController],
  providers: [
    LiveKitMediaProviderAdapter,
    {
      provide: MEDIA_PROVIDER_ADAPTER,
      useExisting: LiveKitMediaProviderAdapter,
    },
  ],
})
export class MediaModule {}
