import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export const useJoinByInvite = () => {
  return useMutation({
    mutationFn: (inviteCode: string) =>
      axios.post<{ redirectUrl: string }>('/api/socket/servers/invite', { inviteCode }).then((res) => res.data),
  })
}
