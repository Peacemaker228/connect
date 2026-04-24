export type AuthRole = string

export interface AuthUser {
  id: string
  email?: string | null
  username?: string | null
  displayName?: string | null
  imageUrl?: string | null
  roles?: AuthRole[]
}

export interface AuthDevice {
  id: string
  name?: string | null
  userAgent?: string | null
  ipAddress?: string | null
  lastActiveAt?: Date | null
}

export interface AuthSession {
  id: string
  userId: string
  device?: AuthDevice | null
  expiresAt?: Date | null
  issuedAt?: Date | null
}

export interface AuthAccessContext {
  resource: string
  action: string
  resourceId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface AuthRedirectOptions {
  returnTo?: string
}

export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>
  getCurrentSession(): Promise<AuthSession | null>
  canAccess(context: AuthAccessContext): Promise<boolean>
  getSignInUrl(options?: AuthRedirectOptions): string | Promise<string>
  revokeSession(sessionId: string): Promise<void>
}
