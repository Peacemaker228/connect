import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import { MessagesService } from './messages.service';

type MessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

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
  createMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Body() body: MessageMutationBody,
  ) {
    return this.messagesService.createMessage(profileId, serverId, channelId, body);
  }

  @Patch(':messageId')
  updateMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('messageId') messageId: string,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Body() body: MessageMutationBody,
  ) {
    return this.messagesService.updateMessage(profileId, serverId, channelId, messageId, body);
  }

  @Delete(':messageId')
  deleteMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('messageId') messageId: string,
    @Query('serverId') serverId: string | undefined,
    @Query('channelId') channelId: string | undefined,
  ) {
    return this.messagesService.deleteMessage(profileId, serverId, channelId, messageId);
  }
}
