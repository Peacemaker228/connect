import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
