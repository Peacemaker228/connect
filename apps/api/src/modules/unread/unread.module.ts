import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UnreadController } from './unread.controller';
import { UnreadService } from './unread.service';

@Module({
  imports: [AuthModule],
  controllers: [UnreadController],
  providers: [UnreadService],
})
export class UnreadModule {}
