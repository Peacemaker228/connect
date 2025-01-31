export const getServerId = (url: string): string | null => {
  const searchParams = new URL(url).searchParams
  return searchParams.get('serverId')
}
