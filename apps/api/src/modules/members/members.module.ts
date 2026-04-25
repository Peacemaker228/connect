import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [RealtimeModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
