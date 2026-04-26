export type ApiAuthStrategy =
  | 'anonymous'
  | 'profile-header'
  | 'user-header'
  | 'access-token';

export type AuthenticatedApiAuthStrategy = 'profile-header' | 'access-token';

export interface AnonymousApiAuthContext {
  isAuthenticated: false;
  strategy: 'anonymous';
  profileId?: undefined;
  sessionId?: undefined;
  userId?: undefined;
}

export interface AuthenticatedApiAuthContext {
  isAuthenticated: true;
  strategy: AuthenticatedApiAuthStrategy;
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

export interface ApiAuthIssuedSessionSnapshot {
  sessionId: string;
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface ApiAuthCookieTransportSnapshot {
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
}

export interface ApiAuthSessionExchangeSnapshot {
  session: ApiAuthSessionSnapshot;
  issuedSession: ApiAuthIssuedSessionSnapshot;
  cookieTransport: ApiAuthCookieTransportSnapshot;
}

export interface ApiAuthIdentityPayload {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  primaryEmailAddress: string | null;
}

export interface ApiAuthPasswordRegistrationPayload {
  email: string;
  password: string;
  name?: string | null;
}

export interface ApiAuthPasswordLoginPayload {
  email: string;
  password: string;
}
