import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  createChatMessageCreatedRealtimeEvent,
  createChatMessageUpdatedRealtimeEvent,
} from '../realtime/realtime.events';
import { MessagesService } from './messages.service';

type MessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

@Controller('messages')
@UseGuards(RequireAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  getMessages(
    @CurrentProfileId() profileId: string,
    @Query('channelId') channelId: string | undefined,
    @Query('cursor') cursor: string | undefined,
  ) {
    return this.messagesService.getMessages(profileId, channelId, cursor);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createMessage(
    @CurrentProfileId() profileId: string,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Body() body: MessageMutationBody,
  ) {
    const message = await this.messagesService.createMessage(profileId, serverId, channelId, body);

    if (channelId) {
      this.realtimeGateway.emit(createChatMessageCreatedRealtimeEvent(channelId, message));
    }

    return message;
  }

  @Patch(':messageId')
  async updateMessage(
    @CurrentProfileId() profileId: string,
    @Param('messageId') messageId: string,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Body() body: MessageMutationBody,
  ) {
    const message = await this.messagesService.updateMessage(profileId, serverId, channelId, messageId, body);

    if (channelId) {
      this.realtimeGateway.emit(createChatMessageUpdatedRealtimeEvent(channelId, message));
    }

    return message;
  }

  @Delete(':messageId')
  async deleteMessage(
    @CurrentProfileId() profileId: string,
    @Param('messageId') messageId: string,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
  ) {
    const message = await this.messagesService.deleteMessage(profileId, serverId, channelId, messageId);

    if (channelId) {
      this.realtimeGateway.emit(createChatMessageUpdatedRealtimeEvent(channelId, message));
    }

    return message;
  }
}
