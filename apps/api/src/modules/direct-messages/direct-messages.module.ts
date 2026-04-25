import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService],
})
export class DirectMessagesModule {}
