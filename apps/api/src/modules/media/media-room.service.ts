import { Injectable, NotFoundException } from '@nestjs/common';

import type { MediaRoomDescriptor } from '../../../../../packages/app-core/src/contracts';
import type { ResolvedMediaRoomAccess } from './media-access.service';

@Injectable()
export class MediaRoomService {
  private readonly rooms = new Map<string, MediaRoomDescriptor>();

  resolveRoom(access: ResolvedMediaRoomAccess): MediaRoomDescriptor {
    const existingRoom = this.rooms.get(access.roomId);
    const lifecycle = existingRoom?.lifecycle === 'closed' ? 'open' : existingRoom?.lifecycle ?? 'open';
    const room: MediaRoomDescriptor = {
      roomId: access.roomId,
      scope: access.scope,
      mode: access.mode,
      displayName: access.displayName,
      lifecycle,
    };

    this.rooms.set(room.roomId, room);

    return room;
  }

  activateRoom(roomId: string): MediaRoomDescriptor {
    const room = this.getRoom(roomId);
    const activeRoom: MediaRoomDescriptor = {
      ...room,
      lifecycle: 'active',
    };

    this.rooms.set(roomId, activeRoom);

    return activeRoom;
  }

  closeRoom(roomId: string | undefined): MediaRoomDescriptor {
    if (!roomId) {
      throw new NotFoundException('Room not found');
    }

    const room = this.getRoom(roomId);
    const closedRoom: MediaRoomDescriptor = {
      ...room,
      lifecycle: 'closed',
    };

    this.rooms.set(roomId, closedRoom);

    return closedRoom;
  }

  getRoom(roomId: string | undefined): MediaRoomDescriptor {
    if (!roomId) {
      throw new NotFoundException('Room not found');
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }
}
