import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageModule } from '../storage/storage.module';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [RealtimeModule, AuthModule, StorageModule],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
