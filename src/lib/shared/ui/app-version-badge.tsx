import { Badge } from '@/lib/shared/ui/badge'

export const AppVersionBadge = () => {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'local'

  return (
    <Badge className="fixed bottom-3 right-3 z-50 pointer-events-none select-none border border-black/10 bg-white/80 text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#1c1d21]/80 dark:text-zinc-300">
      {`v${version} • ${appEnv}`}
    </Badge>
  )
}
