import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Profile } from '@prisma/client'

export const useGetProfile = () => {
  const { data: profile, ...query } = useQuery({
    queryKey: ['profile'],
    queryFn: () => axios.get(`/api/user`).then<Profile>((res) => res.data),
  })

  return { profile, ...query }
}
