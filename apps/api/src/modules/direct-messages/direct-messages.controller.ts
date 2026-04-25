import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
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
@UseGuards(RequireAuthGuard)
export class DirectMessagesController {
  constructor(
    private readonly directMessagesService: DirectMessagesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  getMessages(
    @CurrentProfileId() profileId: string,
    @Query('conversationId') conversationId: string | undefined,
    @Query('cursor') cursor: string | undefined,
  ) {
    return this.directMessagesService.getMessages(profileId, conversationId, cursor);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createMessage(
    @CurrentProfileId() profileId: string,
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
    @CurrentProfileId() profileId: string,
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
    @CurrentProfileId() profileId: string,
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
