export type CreateMediaRoomAccessInput = {
  room: string;
  username: string;
};

export type MediaRoomAccessResponse = {
  token: string;
};

export const MEDIA_PROVIDER_ADAPTER = Symbol('MEDIA_PROVIDER_ADAPTER');

export interface MediaProviderAdapter {
  createRoomAccess(input: CreateMediaRoomAccessInput): Promise<MediaRoomAccessResponse>;
}
