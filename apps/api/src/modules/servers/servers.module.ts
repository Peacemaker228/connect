import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [RealtimeModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
