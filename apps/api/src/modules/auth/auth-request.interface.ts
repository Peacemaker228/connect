import type { ApiAuthContext } from './auth.types';

export type AuthRequestHeaders = Record<string, string | string[] | undefined>;

export type AuthRequest = {
  headers: AuthRequestHeaders;
  authContext?: ApiAuthContext;
};
