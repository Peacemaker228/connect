export type MediaConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type MediaRoomScopeKind = 'channel' | 'conversation' | 'meeting'

export type MediaRoomMode = 'persistent-channel' | 'private-call' | 'meeting' | 'large-room' | 'stage'

export type MediaRoomScope =
  | {
      kind: 'channel'
      serverId: string
      channelId: string
    }
  | {
      kind: 'conversation'
      serverId: string
      conversationId: string
    }
  | {
      kind: 'meeting'
      meetingId: string
      serverId?: string
    }

export type MediaRoomLifecycleState =
  | 'resolving'
  | 'open'
  | 'joining'
  | 'active'
  | 'empty'
  | 'closing'
  | 'closed'

export type MediaParticipantLifecycleState =
  | 'joining'
  | 'joined'
  | 'left'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnected'
  | 'expired'

export interface MediaRoomDescriptor {
  roomId: string
  scope: MediaRoomScope
  mode: MediaRoomMode
  displayName?: string | null
  lifecycle: MediaRoomLifecycleState
}

export interface MediaParticipantIdentity {
  profileId: string
  memberId?: string
  displayName: string
}

export interface MediaParticipantSession {
  participantSessionId: string
  roomId: string
  identity: MediaParticipantIdentity
  connectionId?: string
  lifecycle: MediaParticipantLifecycleState
  joinedAt?: string
  lastSeenAt?: string
}

export interface MediaParticipant {
  id: string
  displayName?: string | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenShareEnabled: boolean
}

export interface MediaRoom {
  id: string
  name?: string | null
}

export interface MediaRoomAccessRequest {
  roomId: string
  participantId: string
  displayName?: string
  scope?: MediaRoomScope
  mode?: MediaRoomMode
  identity?: MediaParticipantIdentity
}

export interface MediaProviderAccessMetadata {
  endpoint?: string
  token?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export interface MediaRoomAccess {
  room: MediaRoom
  participant: MediaParticipant
  token?: string
  endpoint?: string
  descriptor?: MediaRoomDescriptor
  participantSession?: MediaParticipantSession
  providerAccess?: MediaProviderAccessMetadata
  permissions?: MediaPermissionSnapshot
  state?: MediaStateSnapshot
}

export interface MediaPermissions {
  join: boolean
  publishAudio: boolean
  publishVideo: boolean
  publishScreenShare: boolean
  subscribe: boolean
  moderate: boolean
}

export interface LegacyMediaPermissions {
  audio: boolean
  video: boolean
  screenShare: boolean
}

export type MediaPermissionReason =
  | 'allowed'
  | 'auth-required'
  | 'not-room-member'
  | 'channel-denied'
  | 'conversation-denied'
  | 'meeting-denied'
  | 'room-closed'
  | 'policy-denied'

export interface MediaPermissionSnapshot {
  roomId: string
  participantSessionId?: string
  permissions: MediaPermissions
  reason?: MediaPermissionReason
}

export interface MediaBooleanState {
  audio: boolean
  video: boolean
  screenShare: boolean
}

export interface MediaState {
  desired: MediaBooleanState
  published: MediaBooleanState
}

export interface MediaStatePatch {
  desired?: Partial<MediaBooleanState>
}

export interface MediaStateSnapshot {
  roomId: string
  participantSessionId: string
  state: MediaState
  updatedAt: string
}

export type MediaTrackKind = 'audio' | 'video'

export type MediaTrackSource = 'microphone' | 'camera' | 'screen'

export type MediaTrackState = 'publishing' | 'published' | 'muted' | 'paused' | 'unpublished' | 'failed'

export interface MediaTrack {
  trackId: string
  roomId: string
  ownerParticipantSessionId: string
  kind: MediaTrackKind
  source: MediaTrackSource
  state: MediaTrackState
  label?: string | null
  createdAt?: string
  updatedAt?: string
}

export type MediaDisconnectReason =
  | 'intentional-leave'
  | 'network-disconnect'
  | 'page-refresh'
  | 'transport-failure'
  | 'server-restart'
  | 'timeout'
  | 'unknown'

export interface MediaReconnectPolicy {
  timeoutMs: number
  allowResume: boolean
}

export interface MediaReconnectState {
  participantSessionId: string
  roomId: string
  startedAt: string
  expiresAt: string
  reason: MediaDisconnectReason
  resumeToken?: string
}

export interface ResumeMediaSessionCommand {
  roomId: string
  participantSessionId: string
  resumeToken?: string
}

export type MediaScreenShareReplacePolicy = 'deny' | 'replace-own' | 'moderator-can-replace'

export interface MediaScreenSharePolicy {
  allowed: boolean
  maxActiveShares: number
  currentPresenterParticipantSessionId?: string
  replacePolicy: MediaScreenShareReplacePolicy
}

export type MediaErrorCode =
  | 'auth-required'
  | 'permission-denied'
  | 'room-not-found'
  | 'room-closed'
  | 'participant-not-found'
  | 'participant-session-expired'
  | 'invalid-room-scope'
  | 'device-permission-denied'
  | 'device-in-use'
  | 'device-not-found'
  | 'publish-denied'
  | 'subscribe-denied'
  | 'screen-share-denied'
  | 'transport-failed'
  | 'ice-failed'
  | 'reconnect-timeout'
  | 'state-conflict'
  | 'provider-unavailable'
  | 'unknown'

export interface MediaError {
  code: MediaErrorCode
  message?: string
  roomId?: string
  participantSessionId?: string
  recoverable: boolean
}

export interface MediaParticipantStatePatch {
  audio?: boolean
  video?: boolean
  screenShare?: boolean
}

export const MEDIA_CLIENT_COMMAND_NAMES = {
  resolveRoomAccess: 'resolveRoomAccess',
  createOrResolveRoom: 'createOrResolveRoom',
  joinRoom: 'joinRoom',
  leaveRoom: 'leaveRoom',
  closeRoom: 'closeRoom',
  updateDesiredMediaState: 'updateDesiredMediaState',
  publishTrack: 'publishTrack',
  unpublishTrack: 'unpublishTrack',
  startScreenShare: 'startScreenShare',
  stopScreenShare: 'stopScreenShare',
  subscribeToTrack: 'subscribeToTrack',
  unsubscribeFromTrack: 'unsubscribeFromTrack',
  beginReconnect: 'beginReconnect',
  resumeSession: 'resumeSession',
} as const

export type MediaClientCommandName =
  (typeof MEDIA_CLIENT_COMMAND_NAMES)[keyof typeof MEDIA_CLIENT_COMMAND_NAMES]

export const MEDIA_SERVER_EVENT_NAMES = {
  roomResolved: 'media.room.resolved',
  roomCreated: 'media.room.created',
  roomJoined: 'media.room.joined',
  roomLeft: 'media.room.left',
  roomEmpty: 'media.room.empty',
  roomClosing: 'media.room.closing',
  roomClosed: 'media.room.closed',
  participantJoined: 'media.participant.joined',
  participantLeft: 'media.participant.left',
  participantDisconnected: 'media.participant.disconnected',
  participantReconnecting: 'media.participant.reconnecting',
  participantReconnected: 'media.participant.reconnected',
  participantExpired: 'media.participant.expired',
  participantMediaStateChanged: 'media.participant.media-state-changed',
  trackPublished: 'media.track.published',
  trackUnpublished: 'media.track.unpublished',
  screenShareStarted: 'media.screen-share.started',
  screenShareStopped: 'media.screen-share.stopped',
  screenShareRejected: 'media.screen-share.rejected',
  permissionChanged: 'media.permission.changed',
  reconnectStarted: 'media.reconnect.started',
  reconnectSucceeded: 'media.reconnect.succeeded',
  reconnectExpired: 'media.reconnect.expired',
  reconnectRejected: 'media.reconnect.rejected',
  error: 'media.error',
} as const

export type MediaServerEventName = (typeof MEDIA_SERVER_EVENT_NAMES)[keyof typeof MEDIA_SERVER_EVENT_NAMES]

export interface MediaCommandPayloadBase {
  requestId: string
  roomId?: string
  scope?: MediaRoomScope
  participantSessionId?: string
}

export interface MediaRoomCommandBase extends MediaCommandPayloadBase {
  scope: MediaRoomScope
  mode?: MediaRoomMode
}

export interface MediaParticipantCommandBase extends MediaCommandPayloadBase {
  roomId: string
  participantSessionId: string
}

export type ResolveRoomAccessCommandPayload = MediaRoomCommandBase

export type CreateOrResolveRoomCommandPayload = MediaRoomCommandBase

export interface JoinRoomCommandPayload extends MediaRoomCommandBase {
  desiredState?: MediaStatePatch
}

export interface LeaveRoomCommandPayload extends MediaParticipantCommandBase {
  reason?: MediaDisconnectReason
}

export interface CloseRoomCommandPayload extends MediaCommandPayloadBase {
  roomId: string
}

export interface UpdateDesiredMediaStateCommandPayload extends MediaParticipantCommandBase {
  patch: MediaStatePatch
}

export interface PublishTrackCommandPayload extends MediaParticipantCommandBase {
  kind: MediaTrackKind
  source: MediaTrackSource
}

export interface UnpublishTrackCommandPayload extends MediaParticipantCommandBase {
  trackId: string
}

export type ScreenShareCommandPayload = MediaParticipantCommandBase

export interface TrackSubscriptionCommandPayload extends MediaParticipantCommandBase {
  trackId: string
}

export interface BeginReconnectCommandPayload extends MediaParticipantCommandBase {
  reason: MediaDisconnectReason
}

export interface ResumeSessionCommandPayload extends MediaParticipantCommandBase {
  resumeToken?: string
}

export interface MediaServerEventPayloadBase {
  roomId: string
  occurredAt: string
  eventId?: string
}

export interface MediaRoomEventPayload extends MediaServerEventPayloadBase {
  room: MediaRoomDescriptor
}

export interface MediaParticipantEventPayload extends MediaServerEventPayloadBase {
  participantSessionId: string
  participant: MediaParticipantSession
}

export interface MediaTrackEventPayload extends MediaServerEventPayloadBase {
  trackId: string
  ownerParticipantSessionId: string
  track: MediaTrack
}

export interface MediaPermissionEventPayload extends MediaServerEventPayloadBase {
  participantSessionId?: string
  permissions: MediaPermissionSnapshot
}

export interface MediaReconnectEventPayload extends MediaServerEventPayloadBase {
  participantSessionId: string
  reconnect: MediaReconnectState
}

export interface MediaErrorEventPayload extends MediaServerEventPayloadBase {
  error: MediaError
}

export type CreateRoomAccessRequest = MediaRoomAccessRequest
export type CreateRoomAccess = MediaRoomAccess
export type TransitionalMediaPermissions = LegacyMediaPermissions

export interface MediaProvider {
  createRoomAccess(request: MediaRoomAccessRequest): Promise<MediaRoomAccess>
  getParticipant(roomId: string, participantId: string): Promise<MediaParticipant | null>
  updateParticipantState(roomId: string, participantId: string, patch: MediaParticipantStatePatch): Promise<MediaParticipant>
  getPermissions(): Promise<MediaPermissions>
}
