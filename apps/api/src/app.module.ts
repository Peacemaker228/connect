import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { DirectMessagesModule } from './modules/direct-messages/direct-messages.module';
import { HealthModule } from './modules/health/health.module';
import { InvitesModule } from './modules/invites/invites.module';
import { MediaModule } from './modules/media/media.module';
import { MembersModule } from './modules/members/members.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ServersModule } from './modules/servers/servers.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ServersModule,
    ChannelsModule,
    MembersModule,
    InvitesModule,
    MessagesModule,
    DirectMessagesModule,
    RealtimeModule,
    MediaModule,
    StorageModule,
  ],
})
export class AppModule {}
