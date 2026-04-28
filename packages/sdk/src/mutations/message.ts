import { useMutation } from '@tanstack/react-query'
import { Member, Message, Profile } from '@prisma/client'
import { getBackendApiBaseUrl, privateApiInstance } from '../api/http-client'

type MessageWithMemberProfile = Message & {
  member: Member & {
    profile: Profile
  }
}

export type MessageMutationPayload = {
  content?: string
  fileUrl?: string | null
}

type MessageMutationParams = {
  apiUrl: string
  query?: Record<string, unknown>
}

type MessageWriteMutationParams = MessageMutationParams & {
  payload: MessageMutationPayload
}

const normalizeMessageApiUrl = (apiUrl: string) => {
  if (!getBackendApiBaseUrl()) {
    return apiUrl
  }

  return apiUrl
    .replace('/api/socket/messages', '/api/messages')
    .replace('/api/socket/direct-messages', '/api/direct-messages')
}

const createMessageMutationPath = (apiUrl: string, query?: Record<string, unknown>) => {
  const searchParams = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    searchParams.set(key, String(value))
  })

  const search = searchParams.toString()
  const path = normalizeMessageApiUrl(apiUrl)

  return search ? `${path}?${search}` : path
}

export const useCreateMessage = () => {
  return useMutation({
    mutationFn: ({ apiUrl, query, payload }: MessageWriteMutationParams) =>
      privateApiInstance
        .post<MessageWithMemberProfile>(createMessageMutationPath(apiUrl, query), payload)
        .then((res) => res.data),
  })
}

export const useUpdateMessage = () => {
  return useMutation({
    mutationFn: ({ apiUrl, query, payload }: MessageWriteMutationParams) =>
      privateApiInstance
        .patch<MessageWithMemberProfile>(createMessageMutationPath(apiUrl, query), payload)
        .then((res) => res.data),
  })
}

export const useDeleteMessage = () => {
  return useMutation({
    mutationFn: ({ apiUrl, query }: MessageMutationParams) =>
      privateApiInstance
        .delete<MessageWithMemberProfile>(createMessageMutationPath(apiUrl, query))
        .then((res) => res.data),
  })
}
