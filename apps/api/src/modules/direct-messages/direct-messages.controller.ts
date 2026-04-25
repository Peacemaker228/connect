import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  createChatMessageCreatedRealtimeEvent,
  createChatMessageUpdatedRealtimeEvent,
} from '../realtime/realtime.events';
import { DirectMessagesService } from './direct-messages.service';

type DirectMessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

@Controller('direct-messages')
export class DirectMessagesController {
  constructor(
    private readonly directMessagesService: DirectMessagesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  getMessages(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('conversationId') conversationId: string | undefined,
    @Query('cursor') cursor: string | undefined,
  ) {
    return this.directMessagesService.getMessages(profileId, conversationId, cursor);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('conversationId') conversationId: string | undefined,
    @Body() body: DirectMessageMutationBody,
  ) {
    const message = await this.directMessagesService.createMessage(profileId, conversationId, body);

    if (conversationId) {
      this.realtimeGateway.emit(createChatMessageCreatedRealtimeEvent(conversationId, message));
    }

    return message;
  }

  @Patch(':directMessageId')
  async updateMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('directMessageId') directMessageId: string,
    @Query('conversationId') conversationId: string | undefined,
    @Body() body: DirectMessageMutationBody,
  ) {
    const message = await this.directMessagesService.updateMessage(profileId, conversationId, directMessageId, body);

    if (conversationId) {
      this.realtimeGateway.emit(createChatMessageUpdatedRealtimeEvent(conversationId, message));
    }

    return message;
  }

  @Delete(':directMessageId')
  async deleteMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('directMessageId') directMessageId: string,
    @Query('conversationId') conversationId: string | undefined,
  ) {
    const message = await this.directMessagesService.deleteMessage(profileId, conversationId, directMessageId);

    if (conversationId) {
      this.realtimeGateway.emit(createChatMessageUpdatedRealtimeEvent(conversationId, message));
    }

    return message;
  }
}
