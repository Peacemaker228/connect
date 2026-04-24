export enum ERoutes {
  MAIN_PAGE = '/',
  SIGN_IN = '/sign-in',
  SIGN_UP = '/sign-up',
  SERVERS = '/servers',
  CHANNELS = '/channels',
  CONVERSATIONS = '/conversations',
}

export const getSignInRedirectUrl = (targetPath: string) => {
  const searchParams = new URLSearchParams({
    redirect_url: targetPath,
  })

  return `${ERoutes.SIGN_IN}?${searchParams.toString()}`
}
