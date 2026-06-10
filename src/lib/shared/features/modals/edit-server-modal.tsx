'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { ServerListItemDto, ServerMembersProfilesDto } from '@app-core/contracts'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { serverFormSchema } from '@app-core/schemas/server-form-schema'
import { ServerModal } from '@/lib/shared/features/modals/common/server-modal'
import { useCallback, useEffect } from 'react'
import { deleteUploadedFile } from '@/lib/shared/utils/delete-upload'
import { useStagedUpload } from '@/lib/shared/utils/hooks/use-staged-upload'
import { useUpdateServer } from '@sdk/mutations/server'
import { getServerQueryKey } from '@sdk/queries/server'

export const EditServerModal = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { cleanupStagedValue, isStagedValue, markCommitted, registerUploadedValue, reset } =
    useStagedUpload('serverImage')
  const { mutateAsync: updateServer } = useUpdateServer()

  const form = useForm({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
    },
  })

  const { isOpen, onClose, type, data } = useModal()

  const { server } = data

  const isModalOpen = isOpen && type === 'editServer'

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: z.infer<typeof serverFormSchema>) => {
    if (!server?.id) {
      return
    }

    try {
      const updatedServer = await updateServer({ serverId: server.id, payload: data })

      queryClient.setQueryData<ServerListItemDto[]>(['servers'], (servers = []) =>
        servers.map((candidate) =>
          candidate.id === updatedServer.id ? { ...candidate, ...updatedServer } : candidate,
        ),
      )
      queryClient.setQueryData<ServerMembersProfilesDto>(getServerQueryKey(updatedServer.id), (currentServer) =>
        currentServer ? { ...currentServer, ...updatedServer } : currentServer,
      )

      markCommitted(data.imageUrl)
      reset()

      if (server?.imageUrl && server.imageUrl !== data.imageUrl) {
        try {
          await deleteUploadedFile(server.imageUrl, 'serverImage')
        } catch (error) {
          console.warn(error)
        }
      }

      form.reset()
      onClose()
      router.refresh()
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: getServerQueryKey(updatedServer.id) })
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (server) {
      reset()
      form.setValue('name', server.name)
      form.setValue('imageUrl', server.imageUrl)
    }
  }, [form, reset, server])

  const handleClose = useCallback(() => {
    void (async () => {
      try {
        await cleanupStagedValue(form.getValues('imageUrl'))
      } catch (error) {
        console.warn(error)
      } finally {
        reset()
        onClose()

        if (server) {
          form.setValue('name', server.name)
          form.setValue('imageUrl', server.imageUrl)
        }
      }
    })()
  }, [cleanupStagedValue, form, onClose, reset, server])

  return (
    <ServerModal
      form={form}
      onSubmitAction={handleSubmit}
      isLoading={isLoading}
      isModalOpen={isModalOpen}
      onClose={handleClose}
      type="edit"
      isStagedImageValueAction={isStagedValue}
      onCleanupStagedImageAction={cleanupStagedValue}
      onImageUploadCompleteAction={registerUploadedValue}
    />
  )
}
