import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
