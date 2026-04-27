import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageModule } from '../storage/storage.module';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';

@Module({
  imports: [RealtimeModule, AuthModule, StorageModule],
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService],
})
export class DirectMessagesModule {}
