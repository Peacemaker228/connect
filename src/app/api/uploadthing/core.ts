import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { currentProfile } from '@/lib/shared/utils/current-profile'

const f = createUploadthing()

const handleAuth = async () => {
  const profile = await currentProfile()

  if (!profile) throw new Error('Unauthorized')

  return {
    profileId: profile.id,
    userId: profile.userId,
  }
}
export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  messageFile: f(['image', 'pdf'])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
