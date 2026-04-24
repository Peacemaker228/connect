export type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface RealtimeEvent<TPayload = unknown> {
  channel: string
  event: string
  payload: TPayload
}

export interface RealtimeSubscription {
  unsubscribe(): void
}

export interface RealtimePublishInput<TPayload = unknown> {
  channel: string
  event: string
  payload: TPayload
}

export interface RealtimeProvider {
  connect(): Promise<void> | void
  disconnect(): Promise<void> | void
  getConnectionState(): RealtimeConnectionState
  subscribe<TPayload = unknown>(
    channel: string,
    listener: (event: RealtimeEvent<TPayload>) => void,
  ): RealtimeSubscription
  publish<TPayload = unknown>(input: RealtimePublishInput<TPayload>): Promise<void> | void
}
