const DESKTOP_PROTOCOL = 'axconnect:'

export const getDesktopInviteUrl = (inviteCode: string) => {
  return `axconnect://invite/${inviteCode}`
}

export const getAppPathFromDesktopDeepLink = (urlString: string) => {
  try {
    const url = new URL(urlString)

    if (url.protocol !== DESKTOP_PROTOCOL) {
      return null
    }

    if (url.hostname === 'invite') {
      const inviteCode = url.pathname.replace(/^\/+/, '')

      if (inviteCode) {
        return `/invite/${inviteCode}`
      }
    }

    const pathFromQuery = url.searchParams.get('path')

    if (pathFromQuery?.startsWith('/')) {
      return pathFromQuery
    }

    return null
  } catch {
    return null
  }
}
