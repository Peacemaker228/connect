import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
