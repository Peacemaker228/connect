import { db } from '@/lib/shared/utils/db'
import { getProfileName } from '@app-core/profiles/get-profile-name'

type ClerkEmailAddress = {
  emailAddress: string
}

type ClerkUserLike = {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  imageUrl: string | null
  emailAddresses: ClerkEmailAddress[]
}

export const ensureProfile = async (user: ClerkUserLike) => {
  return db.profile.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
      name: getProfileName(user),
      imageUrl: user.imageUrl ?? '',
      email: user.emailAddresses[0]?.emailAddress ?? '',
    },
  })
}
