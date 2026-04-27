import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import { StorageService } from './storage.service';
import type { UploadedStorageFile } from './storage.types';

type PassthroughResponse = {
  setHeader(name: string, value: string): void;
};

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(RequireAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentProfileId() profileId: string,
    @Body('endpoint') endpoint: string | undefined,
    @UploadedFile() file: UploadedStorageFile | undefined,
  ) {
    return this.storageService.uploadFile(profileId, endpoint, file);
  }

  @Delete('file')
  @UseGuards(RequireAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(
    @CurrentProfileId() profileId: string,
    @Body('endpoint') endpoint: string | undefined,
    @Body('fileKey') fileKey: string | undefined,
    @Body('fileUrl') fileUrl: string | undefined,
  ) {
    return this.storageService.deleteFile(profileId, endpoint, fileUrl, fileKey);
  }

  @Get('access')
  @Redirect(undefined, HttpStatus.TEMPORARY_REDIRECT)
  async resolveFileAccess(
    @Res({ passthrough: true }) response: PassthroughResponse,
    @Query('endpoint') endpoint: string | undefined,
    @Query('fileKey') fileKey: string | undefined,
    @Query('fileUrl') fileUrl: string | undefined,
  ) {
    const resolvedFileAccess = await this.storageService.resolveFileAccess(endpoint, fileUrl, fileKey);

    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Storage-Access-Kind', resolvedFileAccess.kind);
    response.setHeader('X-Storage-Access-Upstream', resolvedFileAccess.upstream);
    response.setHeader(
      'X-Storage-Access-Compatibility',
      resolvedFileAccess.isLegacyCompatibility ? 'legacy' : 'active',
    );

    return {
      url: resolvedFileAccess.url,
    };
  }
}
