import { currentUser } from '@clerk/nextjs/server'
import { ensureProfile } from '@/lib/shared/utils/ensure-profile'

export const currentProfile = async () => {
  let user = null

  try {
    user = await currentUser()
  } catch (error) {
    console.error('[CURRENT_PROFILE_USER]', error)
    return null
  }

  if (!user) {
    return null
  }

  return ensureProfile(user)
}
