import { currentProfile } from '@/lib/shared/utils/current-profile'

export const initialProfile = async () => {
  return currentProfile()
}
