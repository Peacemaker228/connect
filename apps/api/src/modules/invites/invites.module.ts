import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [RealtimeModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
