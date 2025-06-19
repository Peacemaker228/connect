import { db } from '@/lib/shared/utils/db'
import { currentUser } from '@clerk/nextjs/server'

export const initialProfile = async () => {
  const user = await currentUser()

  const profile = await db.profile.findUnique({
    where: {
      userId: user?.id,
    },
  })

  if (profile) {
    return profile
  }

  const name = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }

    if (user?.username) {
      return user.username
    }

    return 'USER'
  }

  return db.profile.create({
    data: {
      userId: user!.id,
      name: name(),
      imageUrl: user?.imageUrl ?? '',
      email: user?.emailAddresses[0].emailAddress ?? '',
    },
  })
}
