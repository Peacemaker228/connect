import { randomUUID } from 'node:crypto';

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  MediaParticipantIdentity,
  MediaParticipantSession,
  MediaStatePatch,
  MediaStateSnapshot,
} from '../../../../../packages/app-core/src/contracts';

type StoredParticipantSession = {
  participantSession: MediaParticipantSession;
  state: MediaStateSnapshot;
};

type CreateParticipantSessionResult = StoredParticipantSession & {
  supersededParticipantSessions: MediaParticipantSession[];
};

@Injectable()
export class MediaParticipantSessionService {
  private readonly sessions = new Map<string, StoredParticipantSession>();

  createSession({
    roomId,
    identity,
    desiredState,
  }: {
    roomId: string;
    identity: MediaParticipantIdentity;
    desiredState?: MediaStatePatch;
  }): CreateParticipantSessionResult {
    const now = new Date().toISOString();

    const supersededParticipantSessions = this.leaveJoinedSessionsForIdentity({
      roomId,
      identity,
      now,
    });

    const participantSessionId = randomUUID();
    const participantSession: MediaParticipantSession = {
      participantSessionId,
      roomId,
      identity,
      lifecycle: 'joined',
      joinedAt: now,
      lastSeenAt: now,
    };
    const desired = {
      audio: desiredState?.desired?.audio ?? false,
      video: desiredState?.desired?.video ?? false,
      screenShare: desiredState?.desired?.screenShare ?? false,
    };
    const state: MediaStateSnapshot = {
      roomId,
      participantSessionId,
      state: {
        desired,
        published: {
          audio: false,
          video: false,
          screenShare: false,
        },
      },
      updatedAt: now,
    };

    this.sessions.set(participantSessionId, {
      participantSession,
      state,
    });

    return {
      participantSession,
      state,
      supersededParticipantSessions,
    };
  }

  leaveSession({
    profileId,
    roomId,
    participantSessionId,
  }: {
    profileId: string | undefined;
    roomId: string | undefined;
    participantSessionId: string | undefined;
  }): StoredParticipantSession {
    const storedSession = this.getSession(participantSessionId);

    if (roomId && storedSession.participantSession.roomId !== roomId) {
      throw new NotFoundException('Participant session not found');
    }

    if (storedSession.participantSession.identity.profileId !== profileId) {
      throw new ForbiddenException('Participant session access denied');
    }

    const now = new Date().toISOString();
    const participantSession: MediaParticipantSession = {
      ...storedSession.participantSession,
      lifecycle: 'left',
      lastSeenAt: now,
    };
    const state: MediaStateSnapshot = {
      ...storedSession.state,
      state: {
        desired: {
          audio: false,
          video: false,
          screenShare: false,
        },
        published: {
          audio: false,
          video: false,
          screenShare: false,
        },
      },
      updatedAt: now,
    };

    this.sessions.set(participantSession.participantSessionId, {
      participantSession,
      state,
    });

    return {
      participantSession,
      state,
    };
  }

  assertJoinedSessionAccess({
    profileId,
    roomId,
    participantSessionId,
  }: {
    profileId: string | undefined;
    roomId: string | undefined;
    participantSessionId: string | undefined;
  }): MediaParticipantSession {
    const storedSession = this.getSession(participantSessionId);

    if (roomId && storedSession.participantSession.roomId !== roomId) {
      throw new NotFoundException('Participant session not found');
    }

    if (storedSession.participantSession.identity.profileId !== profileId) {
      throw new ForbiddenException('Participant session access denied');
    }

    if (storedSession.participantSession.lifecycle !== 'joined') {
      throw new ForbiddenException('Participant session is not joined');
    }

    return storedSession.participantSession;
  }

  isJoinedSession({
    roomId,
    participantSessionId,
  }: {
    roomId: string | undefined;
    participantSessionId: string | undefined;
  }): boolean {
    const storedSession = participantSessionId
      ? this.sessions.get(participantSessionId)
      : undefined;

    return (
      Boolean(storedSession) &&
      storedSession?.participantSession.roomId === roomId &&
      storedSession?.participantSession.lifecycle === 'joined'
    );
  }

  private leaveJoinedSessionsForIdentity({
    roomId,
    identity,
    now,
  }: {
    roomId: string;
    identity: MediaParticipantIdentity;
    now: string;
  }): MediaParticipantSession[] {
    const identityKey = this.getIdentityKey(identity);
    const supersededParticipantSessions: MediaParticipantSession[] = [];

    for (const [participantSessionId, storedSession] of this.sessions.entries()) {
      if (
        storedSession.participantSession.roomId !== roomId ||
        storedSession.participantSession.lifecycle !== 'joined' ||
        this.getIdentityKey(storedSession.participantSession.identity) !== identityKey
      ) {
        continue;
      }

      supersededParticipantSessions.push(storedSession.participantSession);
      this.sessions.set(participantSessionId, {
        participantSession: {
          ...storedSession.participantSession,
          lifecycle: 'left',
          lastSeenAt: now,
        },
        state: {
          ...storedSession.state,
          state: {
            desired: {
              audio: false,
              video: false,
              screenShare: false,
            },
            published: {
              audio: false,
              video: false,
              screenShare: false,
            },
          },
          updatedAt: now,
        },
      });
    }

    return supersededParticipantSessions;
  }

  private getIdentityKey(identity: MediaParticipantIdentity) {
    return identity.memberId ?? identity.profileId;
  }

  private getSession(participantSessionId: string | undefined): StoredParticipantSession {
    if (!participantSessionId) {
      throw new NotFoundException('Participant session not found');
    }

    const storedSession = this.sessions.get(participantSessionId);

    if (!storedSession) {
      throw new NotFoundException('Participant session not found');
    }

    return storedSession;
  }
}
