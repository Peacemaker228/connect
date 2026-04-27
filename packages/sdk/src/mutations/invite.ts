import { useMutation } from '@tanstack/react-query'
import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

const getJoinInviteRequestPath = () => {
  return getBackendApiBaseUrl() ? '/api/invites/join' : '/api/socket/servers/invite'
}

export const useJoinByInvite = () => {
  return useMutation({
    mutationFn: (inviteCode: string) =>
      privateApiInstance
        .post<{ redirectUrl: string }>(getJoinInviteRequestPath(), { inviteCode })
        .then((res) => res.data),
  })
}
