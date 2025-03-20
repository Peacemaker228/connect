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

  return db.profile.create({
    data: {
      userId: user!.id,
      name: `${user?.firstName ?? 'Имя'} ${user?.lastName ?? 'Фамилия'}`,
      imageUrl: user?.imageUrl ?? '',
      email: user?.emailAddresses[0].emailAddress ?? '',
    },
  })
}
