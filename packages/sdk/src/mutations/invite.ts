import { useMutation } from '@tanstack/react-query'
import { privateApiInstance } from '../api/http-client'

export const useJoinByInvite = () => {
  return useMutation({
    mutationFn: (inviteCode: string) =>
      privateApiInstance
        .post<{ redirectUrl: string }>('/api/invites/join', { inviteCode })
        .then((res) => res.data),
  })
}
