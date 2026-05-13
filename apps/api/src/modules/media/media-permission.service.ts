import { Injectable } from '@nestjs/common';
import { ChannelType, MemberRole } from '@prisma/client';

import type {
  MediaPermissionSnapshot,
  MediaPermissions,
  MediaReconnectPolicy,
  MediaScreenSharePolicy,
} from '../../../../../packages/app-core/src/contracts';
import type { ResolvedMediaRoomAccess } from './media-access.service';

@Injectable()
export class MediaPermissionService {
  getPermissionSnapshot(
    access: ResolvedMediaRoomAccess,
    participantSessionId?: string,
  ): MediaPermissionSnapshot {
    return {
      roomId: access.roomId,
      participantSessionId,
      permissions: this.getPermissions(access),
      reason: 'allowed',
    };
  }

  getScreenSharePolicy(): MediaScreenSharePolicy {
    return {
      allowed: true,
      maxActiveShares: 1,
      replacePolicy: 'replace-own',
    };
  }

  getReconnectPolicy(): MediaReconnectPolicy {
    return {
      timeoutMs: 30000,
      allowResume: true,
    };
  }

  private getPermissions(access: ResolvedMediaRoomAccess): MediaPermissions {
    const isChannelAudioOnly =
      access.scope.kind === 'channel' && access.channelType === ChannelType.AUDIO;
    const canModerate =
      access.memberRole === MemberRole.ADMIN || access.memberRole === MemberRole.MODERATOR;

    return {
      join: true,
      publishAudio: true,
      publishVideo: !isChannelAudioOnly,
      publishScreenShare: true,
      subscribe: true,
      moderate: canModerate,
    };
  }
}
