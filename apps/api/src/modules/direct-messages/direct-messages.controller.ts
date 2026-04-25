import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import { DirectMessagesService } from './direct-messages.service';

type DirectMessageMutationBody = {
  content?: string;
  fileUrl?: string | null;
};

@Controller('direct-messages')
export class DirectMessagesController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

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
  createMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Query('conversationId') conversationId: string | undefined,
    @Body() body: DirectMessageMutationBody,
  ) {
    return this.directMessagesService.createMessage(profileId, conversationId, body);
  }

  @Patch(':directMessageId')
  updateMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('directMessageId') directMessageId: string,
    @Query('conversationId') conversationId: string | undefined,
    @Body() body: DirectMessageMutationBody,
  ) {
    return this.directMessagesService.updateMessage(profileId, conversationId, directMessageId, body);
  }

  @Delete(':directMessageId')
  deleteMessage(
    @Headers('x-profile-id') profileId: string | undefined,
    @Param('directMessageId') directMessageId: string,
    @Query('conversationId') conversationId: string | undefined,
  ) {
    return this.directMessagesService.deleteMessage(profileId, conversationId, directMessageId);
  }
}
