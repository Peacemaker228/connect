import { initialProfile } from '@/lib/shared/utils/initial-profile'
import { db } from '@/lib/shared/utils/db'
import { redirect } from 'next/navigation'
import { InitialModal } from '@/lib/shared/features/modals/initial-modal'

const SetupPage = async () => {
  const profile = await initialProfile()

  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  })

  if (server) {
    return redirect(`/servers/${server.id}`)
  }

  return <InitialModal />
}

export default SetupPage
