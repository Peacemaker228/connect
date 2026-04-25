import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

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
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  getMessages(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Query('cursor') cursor: string | undefined,
  ) {
    return this.messagesService.getMessages(profileId, channelId, cursor);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createMessage(
    @Headers('x-profile-id') profileId: string | undefined,
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
    @Headers('x-profile-id') profileId: string | undefined,
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
    @Headers('x-profile-id') profileId: string | undefined,
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
