'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Server } from '@prisma/client'
import { serverFormSchema } from '@app-core/schemas/server-form-schema'
import { ServerModal } from '@/lib/shared/features/modals/common/server-modal'
import { useState } from 'react'
import { ERoutes } from '@app-core/routing/routes'
import { useStagedUpload } from '@/lib/shared/utils/hooks/use-staged-upload'

export const InitialModal = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const stagedUpload = useStagedUpload('serverImage')

  const form = useForm({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
    },
  })

  const isLoading = form.formState.isSubmitting || isRedirecting

  const handleSubmit = async (data: z.infer<typeof serverFormSchema>) => {
    try {
      const { data: createdServer } = await axios.post<Server>('/api/servers', data)

      queryClient.setQueryData<Server[]>(['servers'], (servers = []) => {
        if (servers.some((server) => server.id === createdServer.id)) {
          return servers
        }

        return [...servers, createdServer]
      })

      stagedUpload.markCommitted(data.imageUrl)
      stagedUpload.reset()
      setIsRedirecting(true)
      router.replace(`${ERoutes.SERVERS}/${createdServer.id}`)
      queryClient.invalidateQueries({ queryKey: ['servers'] })
    } catch (err) {
      setIsRedirecting(false)
      console.log(err)
    }
  }

  const handleClose = () => {
    void (async () => {
      try {
        await stagedUpload.cleanupStagedValue(form.getValues('imageUrl'))
      } catch (error) {
        console.warn(error)
      } finally {
        stagedUpload.reset()
        form.reset()
      }
    })()
  }

  return (
    <ServerModal
      form={form}
      onSubmitAction={handleSubmit}
      isLoading={isLoading}
      isModalOpen
      onClose={handleClose}
      isStagedImageValueAction={stagedUpload.isStagedValue}
      onCleanupStagedImageAction={stagedUpload.cleanupStagedValue}
      onImageUploadCompleteAction={stagedUpload.registerUploadedValue}
    />
  )
}
