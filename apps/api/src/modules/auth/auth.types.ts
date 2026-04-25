export type ApiAuthStrategy = 'anonymous' | 'profile-header' | 'user-header';

export interface AnonymousApiAuthContext {
  isAuthenticated: false;
  strategy: 'anonymous';
  profileId?: undefined;
  sessionId?: undefined;
  userId?: undefined;
}

export interface AuthenticatedApiAuthContext {
  isAuthenticated: true;
  strategy: 'profile-header';
  profileId: string;
  sessionId?: string;
  userId?: string;
}

export type ApiAuthContext = AnonymousApiAuthContext | AuthenticatedApiAuthContext;

export interface ApiAuthProfileSnapshot {
  id: string;
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiAuthUserSnapshot {
  id: string;
  displayName: string | null;
  email: string | null;
  imageUrl: string | null;
}

export interface ApiAuthSessionSnapshot {
  isAuthenticated: boolean;
  strategy: ApiAuthStrategy;
  sessionId: string | null;
  profile: ApiAuthProfileSnapshot | null;
  user: ApiAuthUserSnapshot | null;
}

export interface ApiAuthIdentityPayload {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  primaryEmailAddress: string | null;
}
