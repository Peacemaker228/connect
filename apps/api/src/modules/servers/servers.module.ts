import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
