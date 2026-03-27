import { db } from '@/lib/shared/utils/db'

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

const getProfileName = (user: ClerkUserLike) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }

  if (user.username) {
    return user.username
  }

  return 'USER'
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
