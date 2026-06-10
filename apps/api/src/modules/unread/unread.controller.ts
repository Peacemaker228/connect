import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { UnreadService } from './unread.service';

@Controller('unread')
@UseGuards(RequireAuthGuard)
export class UnreadController {
  constructor(private readonly unreadService: UnreadService) {}

  @Get('servers/:serverId/summary')
  getServerUnreadSummary(
    @CurrentProfileId() profileId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.unreadService.getServerUnreadSummary(profileId, serverId);
  }

  @Patch('channels/:channelId/read')
  @HttpCode(HttpStatus.OK)
  markChannelRead(
    @CurrentProfileId() profileId: string,
    @Param('channelId') channelId: string,
    @Query('serverId') serverId: string | undefined,
  ) {
    return this.unreadService.markChannelRead(profileId, serverId, channelId);
  }

  @Patch('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  markConversationRead(
    @CurrentProfileId() profileId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.unreadService.markConversationRead(profileId, conversationId);
  }
}
