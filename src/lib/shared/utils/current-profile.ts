import { currentUser } from '@clerk/nextjs/server'
import { ensureProfile } from '@/lib/shared/utils/ensure-profile'

export const currentProfile = async () => {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return ensureProfile(user)
}
