import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
