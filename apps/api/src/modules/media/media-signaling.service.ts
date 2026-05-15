import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

import type { LocalMediasoupProducerDiscoveryMetadata } from './mediasoup-prototype.service';

export type LocalMediasoupProducerSnapshotEvent = {
  type: 'producer.snapshot';
  roomId: string;
  producers: LocalMediasoupProducerDiscoveryMetadata[];
  occurredAt: string;
};

export type LocalMediasoupProducerPublishedEvent = {
  type: 'producer.published';
  roomId: string;
  producer: LocalMediasoupProducerDiscoveryMetadata;
  occurredAt: string;
};

export type LocalMediasoupProducerClosedEvent = {
  type: 'producer.closed';
  roomId: string;
  participantSessionId: string;
  producerId: string;
  occurredAt: string;
};

export type LocalMediasoupConsumerClosedEvent = {
  type: 'consumer.closed';
  roomId: string;
  participantSessionId: string;
  consumerId: string;
  producerId?: string;
  occurredAt: string;
};

export type LocalMediasoupPrototypeEvent =
  | LocalMediasoupProducerSnapshotEvent
  | LocalMediasoupProducerPublishedEvent
  | LocalMediasoupProducerClosedEvent
  | LocalMediasoupConsumerClosedEvent;

@Injectable()
export class MediaSignalingService {
  private readonly roomEvents = new Map<string, Subject<LocalMediasoupPrototypeEvent>>();

  eventsForRoom(roomId: string): Observable<LocalMediasoupPrototypeEvent> {
    return this.getRoomEvents(roomId).asObservable();
  }

  createProducerSnapshot({
    roomId,
    producers,
  }: {
    roomId: string;
    producers: LocalMediasoupProducerDiscoveryMetadata[];
  }): LocalMediasoupProducerSnapshotEvent {
    return {
      type: 'producer.snapshot',
      roomId,
      producers,
      occurredAt: new Date().toISOString(),
    };
  }

  publishProducerPublished(producer: LocalMediasoupProducerDiscoveryMetadata) {
    this.publish({
      type: 'producer.published',
      roomId: producer.roomId,
      producer,
      occurredAt: new Date().toISOString(),
    });
  }

  publishProducerClosed({
    roomId,
    participantSessionId,
    producerId,
  }: {
    roomId: string;
    participantSessionId: string;
    producerId: string;
  }) {
    this.publish({
      type: 'producer.closed',
      roomId,
      participantSessionId,
      producerId,
      occurredAt: new Date().toISOString(),
    });
  }

  publishConsumerClosed({
    roomId,
    participantSessionId,
    consumerId,
    producerId,
  }: {
    roomId: string;
    participantSessionId: string;
    consumerId: string;
    producerId?: string;
  }) {
    this.publish({
      type: 'consumer.closed',
      roomId,
      participantSessionId,
      consumerId,
      producerId,
      occurredAt: new Date().toISOString(),
    });
  }

  private publish(event: LocalMediasoupPrototypeEvent) {
    this.getRoomEvents(event.roomId).next(event);
  }

  private getRoomEvents(roomId: string) {
    let subject = this.roomEvents.get(roomId);

    if (!subject) {
      subject = new Subject<LocalMediasoupPrototypeEvent>();
      this.roomEvents.set(roomId, subject);
    }

    return subject;
  }
}
