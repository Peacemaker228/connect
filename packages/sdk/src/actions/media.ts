import axios from 'axios'

import type {
  BeginReconnectCommandPayload,
  CloseRoomCommandPayload,
  JoinRoomCommandPayload,
  LeaveRoomCommandPayload,
  MediaError,
  MediaErrorCode,
  MediaParticipantSession,
  MediaPermissionSnapshot,
  MediaProviderAccessMetadata,
  MediaReconnectPolicy,
  MediaReconnectState,
  MediaRoomDescriptor,
  MediaScreenSharePolicy,
  MediaStateSnapshot,
  MediaTrack,
  PublishTrackCommandPayload,
  ResolveRoomAccessCommandPayload,
  ResumeSessionCommandPayload,
  ScreenShareCommandPayload,
  TrackSubscriptionCommandPayload,
  UnpublishTrackCommandPayload,
  UpdateDesiredMediaStateCommandPayload,
} from '@app-core/contracts'
import { resolveBackendApiUrl } from '@app-core/api/backend-api-url'

import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

export type LiveKitTokenRequest = {
  room: string
  username: string
}

export type LiveKitTokenResponse = {
  token: string
}

export type ResolveRoomAccessResponse = {
  room: MediaRoomDescriptor
  permissions: MediaPermissionSnapshot
  screenSharePolicy?: MediaScreenSharePolicy
  reconnectPolicy?: MediaReconnectPolicy
  providerAccess?: MediaProviderAccessMetadata
}

export type JoinRoomResponse = ResolveRoomAccessResponse & {
  participantSession: MediaParticipantSession
  state: MediaStateSnapshot
}

export type LeaveRoomResponse = {
  room?: MediaRoomDescriptor
  participantSession?: MediaParticipantSession
  state?: MediaStateSnapshot
}

export type CloseRoomResponse = {
  room: MediaRoomDescriptor
}

export type MediaCommandAcknowledgement = {
  requestId: string
  accepted: boolean
  error?: MediaError
}

export type MediaStateCommandResponse = MediaCommandAcknowledgement & {
  state?: MediaStateSnapshot
}

export type MediaTrackCommandResponse = MediaCommandAcknowledgement & {
  track?: MediaTrack
  state?: MediaStateSnapshot
}

export type MediaReconnectCommandResponse = MediaCommandAcknowledgement & {
  reconnect?: MediaReconnectState
  participantSession?: MediaParticipantSession
  providerAccess?: MediaProviderAccessMetadata
  state?: MediaStateSnapshot
}

export type MediasoupPrototypeStatus = 'disabled' | 'ready' | 'failed'

export type MediasoupPrototypeTransportDirection = 'send' | 'recv'

export type LocalTurnCredentialResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  urls?: string[]
  username?: string
  credential?: string
  ttlSeconds?: number
  expiresAt?: string
  expiresAtUnixSeconds?: number
  reason?: string
}

export type MediasoupPrototypeHealthResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  version: string
  workerBin: string
  workerPid?: number
  workerClosed?: boolean
  routerId?: string
  routerClosed?: boolean
  routerCodecCount?: number
  routerRtpCapabilities?: Record<string, unknown>
  activeTransportCount?: number
  activeProducerCount?: number
  activeConsumerCount?: number
  activeRoomCount?: number
  trackedSessionCount?: number
  staleSessionTtlMs?: number
  staleSessionSweepIntervalMs?: number
  lastCleanup?: MediasoupPrototypeCleanupResult
  reason?: string
}

export type MediasoupPrototypeCleanupResult = {
  cleanedAt: string
  reason: 'session-close' | 'stale-sweep'
  staleSessionCount: number
  closedTransportCount: number
  closedProducerCount: number
  closedConsumerCount: number
  activeTransportCount: number
  activeProducerCount: number
  activeConsumerCount: number
  activeRoomCount: number
  trackedSessionCount: number
}

export type CreateMediasoupPrototypeTransportRequest = {
  direction?: MediasoupPrototypeTransportDirection
  includeTurnCredentials?: boolean
  roomId?: string
  participantSessionId?: string
}

export type MediasoupPrototypeTransportResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  direction?: MediasoupPrototypeTransportDirection
  transportId?: string
  iceParameters?: Record<string, unknown>
  iceCandidates?: Array<Record<string, unknown>>
  dtlsParameters?: Record<string, unknown>
  sctpParameters?: Record<string, unknown>
  turnCredentials?: LocalTurnCredentialResponse
  reason?: string
}

export type ConnectMediasoupPrototypeTransportRequest = {
  dtlsParameters?: Record<string, unknown>
  roomId?: string
  participantSessionId?: string
}

export type MediasoupPrototypeTransportConnectResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  transportId?: string
  dtlsState?: string
  reason?: string
}

export type MediasoupPrototypeMediaKind = 'audio' | 'video'

export type ProduceMediasoupPrototypeRequest = {
  transportId?: string
  roomId?: string
  participantSessionId?: string
  kind?: MediasoupPrototypeMediaKind
  rtpParameters?: Record<string, unknown>
  paused?: boolean
}

export type MediasoupPrototypeProducerResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  transportId?: string
  roomId?: string
  participantSessionId?: string
  producerId?: string
  kind?: MediasoupPrototypeMediaKind
  paused?: boolean
  reason?: string
}

export type DiscoverMediasoupPrototypeProducersRequest = {
  roomId?: string
  participantSessionId?: string
}

export type HeartbeatMediasoupPrototypeSessionRequest = {
  roomId?: string
  participantSessionId?: string
}

export type HeartbeatMediasoupPrototypeSessionResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  roomId?: string
  participantSessionId?: string
  lastSeenAt?: string
  staleSessionTtlMs?: number
  staleSessionSweepIntervalMs?: number
  reason?: string
}

export type CloseMediasoupPrototypeProducerRequest = {
  roomId?: string
  participantSessionId?: string
}

export type UpdateMediasoupPrototypeProducerPausedRequest = {
  roomId?: string
  participantSessionId?: string
}

export type CloseMediasoupPrototypeConsumerRequest = {
  roomId?: string
  participantSessionId?: string
}

export type MediasoupPrototypeProducerDiscoveryMetadata = {
  producerId: string
  roomId: string
  participantSessionId: string
  kind: MediasoupPrototypeMediaKind
  paused: boolean
  createdAt?: string
}

export type MediasoupPrototypeProducerDiscoveryResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  roomId?: string
  participantSessionId?: string
  producers: MediasoupPrototypeProducerDiscoveryMetadata[]
  reason?: string
}

export type SubscribeMediasoupPrototypeEventsRequest = {
  roomId: string
  participantSessionId: string
}

export type MediasoupPrototypeProducerSnapshotEvent = {
  type: 'producer.snapshot'
  roomId: string
  producers: MediasoupPrototypeProducerDiscoveryMetadata[]
  occurredAt: string
}

export type MediasoupPrototypeProducerPublishedEvent = {
  type: 'producer.published'
  roomId: string
  producer: MediasoupPrototypeProducerDiscoveryMetadata
  occurredAt: string
}

export type MediasoupPrototypeProducerClosedEvent = {
  type: 'producer.closed'
  roomId: string
  participantSessionId: string
  producerId: string
  occurredAt: string
}

export type MediasoupPrototypeConsumerClosedEvent = {
  type: 'consumer.closed'
  roomId: string
  participantSessionId: string
  consumerId: string
  producerId?: string
  occurredAt: string
}

export type MediasoupPrototypeEvent =
  | MediasoupPrototypeProducerSnapshotEvent
  | MediasoupPrototypeProducerPublishedEvent
  | MediasoupPrototypeProducerClosedEvent
  | MediasoupPrototypeConsumerClosedEvent

export type ConsumeMediasoupPrototypeRequest = {
  transportId?: string
  roomId?: string
  participantSessionId?: string
  producerId?: string
  rtpCapabilities?: Record<string, unknown>
  paused?: boolean
}

export type MediasoupPrototypeConsumerResponse = {
  status: MediasoupPrototypeStatus
  enabled: boolean
  transportId?: string
  roomId?: string
  participantSessionId?: string
  consumerId?: string
  producerId?: string
  kind?: MediasoupPrototypeMediaKind
  rtpParameters?: Record<string, unknown>
  type?: string
  paused?: boolean
  producerPaused?: boolean
  reason?: string
}

export type MediaSignalingCommandName =
  | 'updateDesiredMediaState'
  | 'publishTrack'
  | 'unpublishTrack'
  | 'startScreenShare'
  | 'stopScreenShare'
  | 'subscribeToTrack'
  | 'unsubscribeFromTrack'
  | 'beginReconnect'
  | 'resumeSession'

export interface MediaSignalingCommandPayloadMap {
  updateDesiredMediaState: UpdateDesiredMediaStateCommandPayload
  publishTrack: PublishTrackCommandPayload
  unpublishTrack: UnpublishTrackCommandPayload
  startScreenShare: ScreenShareCommandPayload
  stopScreenShare: ScreenShareCommandPayload
  subscribeToTrack: TrackSubscriptionCommandPayload
  unsubscribeFromTrack: TrackSubscriptionCommandPayload
  beginReconnect: BeginReconnectCommandPayload
  resumeSession: ResumeSessionCommandPayload
}

export interface MediaSignalingCommandResponseMap {
  updateDesiredMediaState: MediaStateCommandResponse
  publishTrack: MediaTrackCommandResponse
  unpublishTrack: MediaTrackCommandResponse
  startScreenShare: MediaTrackCommandResponse
  stopScreenShare: MediaTrackCommandResponse
  subscribeToTrack: MediaCommandAcknowledgement
  unsubscribeFromTrack: MediaCommandAcknowledgement
  beginReconnect: MediaReconnectCommandResponse
  resumeSession: MediaReconnectCommandResponse
}

export type MediaSignalingCommandEnvelope<TCommandName extends MediaSignalingCommandName> = {
  command: TCommandName
  payload: MediaSignalingCommandPayloadMap[TCommandName]
}

export class MediaActionError extends Error {
  status?: number
  payload?: unknown
  mediaError: MediaError

  constructor(message: string, status?: number, payload?: unknown, mediaError?: MediaError) {
    super(message)
    this.name = 'MediaActionError'
    this.status = status
    this.payload = payload
    this.mediaError = mediaError ?? {
      code: 'unknown',
      message,
      recoverable: true,
    }
  }
}

const DEFAULT_MEDIA_ERROR_MESSAGE = 'Media request failed'

const MEDIA_CONTROL_PATHS = {
  resolveRoomAccess: '/api/media/rooms/resolve',
  joinRoom: '/api/media/rooms/join',
  leaveRoom: '/api/media/rooms/leave',
  closeRoom: '/api/media/rooms/close',
  signalingCommand: '/api/media/commands',
  mediasoupPrototypeHealth: '/api/media/prototype/mediasoup/health',
  mediasoupPrototypeTransports: '/api/media/prototype/mediasoup/transports',
  mediasoupPrototypeProducers: '/api/media/prototype/mediasoup/producers',
  mediasoupPrototypeProducerDiscovery: '/api/media/prototype/mediasoup/producers/discover',
  mediasoupPrototypeSessionHeartbeat: '/api/media/prototype/mediasoup/sessions/heartbeat',
  mediasoupPrototypeEvents: '/api/media/prototype/mediasoup/events',
  mediasoupPrototypeConsumers: '/api/media/prototype/mediasoup/consumers',
} as const

const MEDIA_ERROR_CODES = [
  'auth-required',
  'permission-denied',
  'room-not-found',
  'room-closed',
  'participant-not-found',
  'participant-session-expired',
  'invalid-room-scope',
  'device-permission-denied',
  'device-in-use',
  'device-not-found',
  'publish-denied',
  'subscribe-denied',
  'screen-share-denied',
  'transport-failed',
  'ice-failed',
  'reconnect-timeout',
  'state-conflict',
  'provider-unavailable',
  'unknown',
] as const satisfies readonly MediaErrorCode[]

const isMediaErrorCode = (code: unknown): code is MediaErrorCode =>
  typeof code === 'string' && (MEDIA_ERROR_CODES as readonly string[]).includes(code)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim()
  }

  if (!isRecord(payload)) {
    return ''
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error.trim()
  }

  if (!('message' in payload)) {
    return ''
  }

  const message = (payload as { message?: unknown }).message

  if (Array.isArray(message)) {
    const firstMessage = message.find(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )

    return firstMessage?.trim() ?? ''
  }

  return typeof message === 'string' ? message.trim() : ''
}

const getPayloadMediaError = (payload: unknown): MediaError | null => {
  if (!isRecord(payload)) {
    return null
  }

  if (isRecord(payload.error)) {
    const nested = getPayloadMediaError(payload.error)

    if (nested) {
      return nested
    }
  }

  if (!isMediaErrorCode(payload.code)) {
    return null
  }

  return {
    code: payload.code,
    message: typeof payload.message === 'string' ? payload.message : undefined,
    roomId: typeof payload.roomId === 'string' ? payload.roomId : undefined,
    participantSessionId:
      typeof payload.participantSessionId === 'string' ? payload.participantSessionId : undefined,
    recoverable: typeof payload.recoverable === 'boolean' ? payload.recoverable : true,
  }
}

const getStatusMediaErrorCode = (status?: number): MediaErrorCode => {
  if (status === 401) {
    return 'auth-required'
  }

  if (status === 403) {
    return 'permission-denied'
  }

  if (status === 404) {
    return 'room-not-found'
  }

  if (status === 409) {
    return 'state-conflict'
  }

  if (status === 408 || status === 504) {
    return 'reconnect-timeout'
  }

  if (status && status >= 500) {
    return 'provider-unavailable'
  }

  return 'unknown'
}

export const normalizeMediaError = ({
  payload,
  status,
  message,
}: {
  payload?: unknown
  status?: number
  message?: string
}): MediaError => {
  const mediaError = getPayloadMediaError(payload)

  if (mediaError) {
    return mediaError
  }

  return {
    code: getStatusMediaErrorCode(status),
    message,
    recoverable: !status || status === 408 || status === 409 || status === 429 || status >= 500,
  }
}

const toMediaActionError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    const mediaError = normalizeMediaError({
      message: DEFAULT_MEDIA_ERROR_MESSAGE,
    })

    return new MediaActionError(DEFAULT_MEDIA_ERROR_MESSAGE, undefined, undefined, mediaError)
  }

  const payload = error.response?.data
  const message = getPayloadMessage(payload) || error.message || DEFAULT_MEDIA_ERROR_MESSAGE
  const mediaError = normalizeMediaError({
    payload,
    status: error.response?.status,
    message,
  })

  return new MediaActionError(message, error.response?.status, payload, mediaError)
}

export const getLiveKitToken = async ({ room, username }: LiveKitTokenRequest) => {
  try {
    const response = await privateApiInstance.get<LiveKitTokenResponse>('/api/media/livekit-token', {
      params: {
        room,
        username,
      },
    })

    return response.data
  } catch (error) {
    throw toMediaActionError(error)
  }
}

const postMediaCommand = async <TResponse, TPayload>(path: string, payload: TPayload) => {
  try {
    const response = await privateApiInstance.post<TResponse>(path, payload)

    return response.data
  } catch (error) {
    throw toMediaActionError(error)
  }
}

const getMediaCommand = async <TResponse>(path: string) => {
  try {
    const response = await privateApiInstance.get<TResponse>(path)

    return response.data
  } catch (error) {
    throw toMediaActionError(error)
  }
}

const postMediaSignalingCommand = async <TCommandName extends MediaSignalingCommandName>(
  command: TCommandName,
  payload: MediaSignalingCommandPayloadMap[TCommandName],
) =>
  postMediaCommand<
    MediaSignalingCommandResponseMap[TCommandName],
    MediaSignalingCommandEnvelope<TCommandName>
  >(MEDIA_CONTROL_PATHS.signalingCommand, {
    command,
    payload,
  })

export const resolveRoomAccess = async (payload: ResolveRoomAccessCommandPayload) =>
  postMediaCommand<ResolveRoomAccessResponse, ResolveRoomAccessCommandPayload>(
    MEDIA_CONTROL_PATHS.resolveRoomAccess,
    payload,
  )

export const joinRoom = async (payload: JoinRoomCommandPayload) =>
  postMediaCommand<JoinRoomResponse, JoinRoomCommandPayload>(MEDIA_CONTROL_PATHS.joinRoom, payload)

export const leaveRoom = async (payload: LeaveRoomCommandPayload) =>
  postMediaCommand<LeaveRoomResponse, LeaveRoomCommandPayload>(MEDIA_CONTROL_PATHS.leaveRoom, payload)

export const closeRoom = async (payload: CloseRoomCommandPayload) =>
  postMediaCommand<CloseRoomResponse, CloseRoomCommandPayload>(MEDIA_CONTROL_PATHS.closeRoom, payload)

export const updateDesiredMediaState = async (payload: UpdateDesiredMediaStateCommandPayload) =>
  postMediaSignalingCommand('updateDesiredMediaState', payload)

export const publishTrack = async (payload: PublishTrackCommandPayload) =>
  postMediaSignalingCommand('publishTrack', payload)

export const unpublishTrack = async (payload: UnpublishTrackCommandPayload) =>
  postMediaSignalingCommand('unpublishTrack', payload)

export const startScreenShare = async (payload: ScreenShareCommandPayload) =>
  postMediaSignalingCommand('startScreenShare', payload)

export const stopScreenShare = async (payload: ScreenShareCommandPayload) =>
  postMediaSignalingCommand('stopScreenShare', payload)

export const subscribeToTrack = async (payload: TrackSubscriptionCommandPayload) =>
  postMediaSignalingCommand('subscribeToTrack', payload)

export const unsubscribeFromTrack = async (payload: TrackSubscriptionCommandPayload) =>
  postMediaSignalingCommand('unsubscribeFromTrack', payload)

export const beginReconnect = async (payload: BeginReconnectCommandPayload) =>
  postMediaSignalingCommand('beginReconnect', payload)

export const resumeSession = async (payload: ResumeSessionCommandPayload) =>
  postMediaSignalingCommand('resumeSession', payload)

export const getMediasoupPrototypeHealth = async () =>
  getMediaCommand<MediasoupPrototypeHealthResponse>(MEDIA_CONTROL_PATHS.mediasoupPrototypeHealth)

export const createMediasoupPrototypeTransport = async (payload: CreateMediasoupPrototypeTransportRequest) =>
  postMediaCommand<MediasoupPrototypeTransportResponse, CreateMediasoupPrototypeTransportRequest>(
    MEDIA_CONTROL_PATHS.mediasoupPrototypeTransports,
    payload,
  )

export const connectMediasoupPrototypeTransport = async (
  transportId: string,
  payload: ConnectMediasoupPrototypeTransportRequest,
) =>
  postMediaCommand<MediasoupPrototypeTransportConnectResponse, ConnectMediasoupPrototypeTransportRequest>(
    `${MEDIA_CONTROL_PATHS.mediasoupPrototypeTransports}/${transportId}/connect`,
    payload,
  )

export const produceMediasoupPrototypeTrack = async (payload: ProduceMediasoupPrototypeRequest) =>
  postMediaCommand<MediasoupPrototypeProducerResponse, ProduceMediasoupPrototypeRequest>(
    MEDIA_CONTROL_PATHS.mediasoupPrototypeProducers,
    payload,
  )

export const discoverMediasoupPrototypeProducers = async (
  payload: DiscoverMediasoupPrototypeProducersRequest,
) =>
  postMediaCommand<
    MediasoupPrototypeProducerDiscoveryResponse,
    DiscoverMediasoupPrototypeProducersRequest
  >(MEDIA_CONTROL_PATHS.mediasoupPrototypeProducerDiscovery, payload)

export const heartbeatMediasoupPrototypeSession = async (
  payload: HeartbeatMediasoupPrototypeSessionRequest,
) =>
  postMediaCommand<
    HeartbeatMediasoupPrototypeSessionResponse,
    HeartbeatMediasoupPrototypeSessionRequest
  >(MEDIA_CONTROL_PATHS.mediasoupPrototypeSessionHeartbeat, payload)

export const closeMediasoupPrototypeProducer = async (
  producerId: string,
  payload: CloseMediasoupPrototypeProducerRequest,
) =>
  postMediaCommand<MediasoupPrototypeProducerResponse, CloseMediasoupPrototypeProducerRequest>(
    `${MEDIA_CONTROL_PATHS.mediasoupPrototypeProducers}/${producerId}/close`,
    payload,
  )

export const pauseMediasoupPrototypeProducer = async (
  producerId: string,
  payload: UpdateMediasoupPrototypeProducerPausedRequest,
) =>
  postMediaCommand<MediasoupPrototypeProducerResponse, UpdateMediasoupPrototypeProducerPausedRequest>(
    `${MEDIA_CONTROL_PATHS.mediasoupPrototypeProducers}/${producerId}/pause`,
    payload,
  )

export const resumeMediasoupPrototypeProducer = async (
  producerId: string,
  payload: UpdateMediasoupPrototypeProducerPausedRequest,
) =>
  postMediaCommand<MediasoupPrototypeProducerResponse, UpdateMediasoupPrototypeProducerPausedRequest>(
    `${MEDIA_CONTROL_PATHS.mediasoupPrototypeProducers}/${producerId}/resume`,
    payload,
  )

export const consumeMediasoupPrototypeTrack = async (payload: ConsumeMediasoupPrototypeRequest) =>
  postMediaCommand<MediasoupPrototypeConsumerResponse, ConsumeMediasoupPrototypeRequest>(
    MEDIA_CONTROL_PATHS.mediasoupPrototypeConsumers,
    payload,
  )

export const closeMediasoupPrototypeConsumer = async (
  consumerId: string,
  payload: CloseMediasoupPrototypeConsumerRequest,
) =>
  postMediaCommand<MediasoupPrototypeConsumerResponse, CloseMediasoupPrototypeConsumerRequest>(
    `${MEDIA_CONTROL_PATHS.mediasoupPrototypeConsumers}/${consumerId}/close`,
    payload,
  )

export const createMediasoupPrototypeEventSource = ({
  roomId,
  participantSessionId,
}: SubscribeMediasoupPrototypeEventsRequest) => {
  const params = new URLSearchParams({
    roomId,
    participantSessionId,
  })
  const path = `${MEDIA_CONTROL_PATHS.mediasoupPrototypeEvents}?${params.toString()}`
  const baseUrl = getBackendApiBaseUrl()
  const url = baseUrl ? resolveBackendApiUrl(path, baseUrl) : path

  return new EventSource(url, { withCredentials: true })
}
