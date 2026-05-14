import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { types as mediasoupTypes } from 'mediasoup';

import { CurrentProfileId } from '../auth/decorators/current-profile-id.decorator';
import { RequireAuthGuard } from '../auth/guards/require-auth.guard';
import {
  LocalMediasoupConsumerMetadata,
  LocalMediasoupProducerMetadata,
  LocalMediasoupPrototypeHealth,
  LocalMediasoupTransportConnectResult,
  LocalMediasoupTransportMetadata,
  MediasoupPrototypeService,
} from './mediasoup-prototype.service';
import { MediaAccessService } from './media-access.service';
import { MediaParticipantSessionService } from './media-participant-session.service';
import { MediaPermissionService } from './media-permission.service';
import {
  MEDIA_PROVIDER_ADAPTER,
  MediaProviderAdapter,
} from './media-provider.adapter';
import { MediaRoomService } from './media-room.service';
import {
  LocalTurnCredentialResponse,
  TurnCredentialService,
} from './turn-credential.service';
import type {
  CloseRoomCommandPayload,
  JoinRoomCommandPayload,
  LeaveRoomCommandPayload,
  MediaError,
  MediaParticipantSession,
  MediaPermissionSnapshot,
  MediaProviderAccessMetadata,
  MediaReconnectPolicy,
  MediaRoomDescriptor,
  MediaScreenSharePolicy,
  MediaStateSnapshot,
  ResolveRoomAccessCommandPayload,
} from '../../../../../packages/app-core/src/contracts';

type MediaSignalingCommandEnvelope = {
  command?: string;
  payload?: {
    requestId?: string;
  };
};

type ResolveRoomAccessResponse = {
  room: MediaRoomDescriptor;
  permissions: MediaPermissionSnapshot;
  screenSharePolicy: MediaScreenSharePolicy;
  reconnectPolicy: MediaReconnectPolicy;
  providerAccess?: MediaProviderAccessMetadata;
};

type JoinRoomResponse = ResolveRoomAccessResponse & {
  participantSession: MediaParticipantSession;
  state: MediaStateSnapshot;
};

type LeaveRoomResponse = {
  room?: MediaRoomDescriptor;
  participantSession?: MediaParticipantSession;
  state?: MediaStateSnapshot;
};

type CloseRoomResponse = {
  room: MediaRoomDescriptor;
};

type MediaCommandAcknowledgement = {
  requestId: string;
  accepted: boolean;
  error?: MediaError;
};

type LocalMediasoupTransportDirection = 'send' | 'recv';

type CreateMediasoupTransportBody = {
  direction?: LocalMediasoupTransportDirection;
  includeTurnCredentials?: boolean;
};

type ConnectMediasoupTransportBody = {
  dtlsParameters?: mediasoupTypes.DtlsParameters;
};

type CreateMediasoupTransportResponse = LocalMediasoupTransportMetadata & {
  turnCredentials?: LocalTurnCredentialResponse;
};

type ProduceMediasoupPrototypeBody = {
  transportId?: string;
  kind?: mediasoupTypes.MediaKind;
  rtpParameters?: mediasoupTypes.RtpParameters;
  paused?: boolean;
};

type ConsumeMediasoupPrototypeBody = {
  transportId?: string;
  producerId?: string;
  rtpCapabilities?: mediasoupTypes.RtpCapabilities;
  paused?: boolean;
};

@Controller('media')
export class MediaController {
  constructor(
    @Inject(MEDIA_PROVIDER_ADAPTER)
    private readonly mediaProviderAdapter: MediaProviderAdapter,
    private readonly mediaAccessService: MediaAccessService,
    private readonly mediaRoomService: MediaRoomService,
    private readonly mediaParticipantSessionService: MediaParticipantSessionService,
    private readonly mediaPermissionService: MediaPermissionService,
    private readonly mediasoupPrototypeService: MediasoupPrototypeService,
    private readonly turnCredentialService: TurnCredentialService,
  ) {}

  @Get('livekit-token')
  async getLiveKitToken(
    @Query('room') room: string | undefined,
    @Query('username') username: string | undefined,
  ) {
    if (!room) {
      throw new BadRequestException('Missing "room" query parameter');
    }

    if (!username) {
      throw new BadRequestException('Missing "username" query parameter');
    }

    return this.mediaProviderAdapter.createRoomAccess({
      room,
      username,
    });
  }

  @Post('rooms/resolve')
  @UseGuards(RequireAuthGuard)
  async resolveRoomAccess(
    @CurrentProfileId() profileId: string | undefined,
    @Body() body: ResolveRoomAccessCommandPayload | undefined,
  ): Promise<ResolveRoomAccessResponse> {
    const access = await this.mediaAccessService.resolveRoomAccess(
      profileId,
      body?.scope,
      body?.mode,
    );
    const room = this.mediaRoomService.resolveRoom(access);
    const permissions = this.mediaPermissionService.getPermissionSnapshot(access);

    return {
      room,
      permissions,
      screenSharePolicy: this.mediaPermissionService.getScreenSharePolicy(),
      reconnectPolicy: this.mediaPermissionService.getReconnectPolicy(),
    };
  }

  @Post('rooms/join')
  @UseGuards(RequireAuthGuard)
  async joinRoom(
    @CurrentProfileId() profileId: string | undefined,
    @Body() body: JoinRoomCommandPayload | undefined,
  ): Promise<JoinRoomResponse> {
    const access = await this.mediaAccessService.resolveRoomAccess(
      profileId,
      body?.scope,
      body?.mode,
    );
    const resolvedRoom = this.mediaRoomService.resolveRoom(access);
    const { participantSession, state } = this.mediaParticipantSessionService.createSession({
      roomId: resolvedRoom.roomId,
      identity: access.identity,
      desiredState: body?.desiredState,
    });
    const room = this.mediaRoomService.activateRoom(resolvedRoom.roomId);
    const permissions = this.mediaPermissionService.getPermissionSnapshot(
      access,
      participantSession.participantSessionId,
    );
    const providerAccess = await this.mediaProviderAdapter.createRoomAccess({
      room: room.roomId,
      username: participantSession.participantSessionId,
    });

    return {
      room,
      permissions,
      participantSession,
      state,
      screenSharePolicy: this.mediaPermissionService.getScreenSharePolicy(),
      reconnectPolicy: this.mediaPermissionService.getReconnectPolicy(),
      providerAccess: {
        token: providerAccess.token,
        metadata: {
          provider: 'livekit-bridge',
        },
      },
    };
  }

  @Post('rooms/leave')
  @UseGuards(RequireAuthGuard)
  async leaveRoom(
    @CurrentProfileId() profileId: string | undefined,
    @Body() body: LeaveRoomCommandPayload | undefined,
  ): Promise<LeaveRoomResponse> {
    const { participantSession, state } = this.mediaParticipantSessionService.leaveSession({
      profileId,
      roomId: body?.roomId,
      participantSessionId: body?.participantSessionId,
    });
    const room = this.mediaRoomService.getRoom(participantSession.roomId);

    return {
      room,
      participantSession,
      state,
    };
  }

  @Post('rooms/close')
  @UseGuards(RequireAuthGuard)
  async closeRoom(
    @CurrentProfileId() profileId: string | undefined,
    @Body() body: CloseRoomCommandPayload | undefined,
  ): Promise<CloseRoomResponse> {
    const existingRoom = this.mediaRoomService.getRoom(body?.roomId);
    const access = await this.mediaAccessService.resolveRoomAccess(
      profileId,
      existingRoom.scope,
      existingRoom.mode,
    );
    const permissions = this.mediaPermissionService.getPermissionSnapshot(access);

    if (!permissions.permissions.moderate) {
      throw new ForbiddenException('Room close requires moderation permission');
    }

    return {
      room: this.mediaRoomService.closeRoom(existingRoom.roomId),
    };
  }

  @Post('commands')
  @UseGuards(RequireAuthGuard)
  acknowledgeMediaCommand(
    @Body() body: MediaSignalingCommandEnvelope | undefined,
  ): MediaCommandAcknowledgement {
    const error: MediaError = {
      code: 'unknown',
      message: 'Media signaling command handling is not implemented yet',
      recoverable: true,
    };

    return {
      requestId: body?.payload?.requestId ?? 'unknown',
      accepted: false,
      error,
    };
  }

  @Get('prototype/mediasoup/health')
  @UseGuards(RequireAuthGuard)
  getMediasoupPrototypeHealth(): Promise<LocalMediasoupPrototypeHealth> {
    return this.mediasoupPrototypeService.getHealth();
  }

  @Post('prototype/mediasoup/transports')
  @UseGuards(RequireAuthGuard)
  async createMediasoupPrototypeTransport(
    @CurrentProfileId() profileId: string | undefined,
    @Body() body: CreateMediasoupTransportBody | undefined,
  ): Promise<CreateMediasoupTransportResponse> {
    const transport = await this.mediasoupPrototypeService.createWebRtcTransport(
      body?.direction === 'recv' ? 'recv' : 'send',
    );

    if (!body?.includeTurnCredentials) {
      return transport;
    }

    return {
      ...transport,
      turnCredentials: this.turnCredentialService.issueLocalCredentials(profileId),
    };
  }

  @Post('prototype/mediasoup/transports/:transportId/connect')
  @UseGuards(RequireAuthGuard)
  connectMediasoupPrototypeTransport(
    @Param('transportId') transportId: string | undefined,
    @Body() body: ConnectMediasoupTransportBody | undefined,
  ): Promise<LocalMediasoupTransportConnectResult> {
    return this.mediasoupPrototypeService.connectWebRtcTransport({
      transportId,
      dtlsParameters: body?.dtlsParameters,
    });
  }

  @Post('prototype/mediasoup/producers')
  @UseGuards(RequireAuthGuard)
  produceMediasoupPrototypeTrack(
    @Body() body: ProduceMediasoupPrototypeBody | undefined,
  ): Promise<LocalMediasoupProducerMetadata> {
    return this.mediasoupPrototypeService.produce({
      transportId: body?.transportId,
      kind: body?.kind,
      rtpParameters: body?.rtpParameters,
      paused: body?.paused,
    });
  }

  @Post('prototype/mediasoup/consumers')
  @UseGuards(RequireAuthGuard)
  consumeMediasoupPrototypeTrack(
    @Body() body: ConsumeMediasoupPrototypeBody | undefined,
  ): Promise<LocalMediasoupConsumerMetadata> {
    return this.mediasoupPrototypeService.consume({
      transportId: body?.transportId,
      producerId: body?.producerId,
      rtpCapabilities: body?.rtpCapabilities,
      paused: body?.paused,
    });
  }

  @Get('prototype/turn/credentials')
  @UseGuards(RequireAuthGuard)
  getLocalTurnCredentials(
    @CurrentProfileId() profileId: string | undefined,
  ): LocalTurnCredentialResponse {
    return this.turnCredentialService.issueLocalCredentials(profileId);
  }
}
