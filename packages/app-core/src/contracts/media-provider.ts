export type MediaConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

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
}

export interface MediaRoomAccess {
  room: MediaRoom
  participant: MediaParticipant
  token?: string
  endpoint?: string
}

export interface MediaPermissions {
  audio: boolean
  video: boolean
  screenShare: boolean
}

export interface MediaParticipantStatePatch {
  audio?: boolean
  video?: boolean
  screenShare?: boolean
}

export interface MediaProvider {
  createRoomAccess(request: MediaRoomAccessRequest): Promise<MediaRoomAccess>
  getParticipant(roomId: string, participantId: string): Promise<MediaParticipant | null>
  updateParticipantState(roomId: string, participantId: string, patch: MediaParticipantStatePatch): Promise<MediaParticipant>
  getPermissions(): Promise<MediaPermissions>
}
