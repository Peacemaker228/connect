export const DEFAULT_DESKTOP_DOWNLOAD_PATH = '/downloads/AxConnect-Setup-latest.exe'

export const getDesktopDownloadUrl = () => {
  return process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL || DEFAULT_DESKTOP_DOWNLOAD_PATH
}
