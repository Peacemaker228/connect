'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { serverFormSchema } from '@app-core/schemas/server-form-schema'
import { ServerModal } from '@/lib/shared/features/modals/common/server-modal'
import { useCallback, useEffect } from 'react'
import { deleteUploadedFile } from '@/lib/shared/utils/delete-upload'
import { useStagedUpload } from '@/lib/shared/utils/hooks/use-staged-upload'

export const EditServerModal = () => {
  const router = useRouter()
  const { cleanupStagedValue, isStagedValue, markCommitted, registerUploadedValue, reset } =
    useStagedUpload('serverImage')

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
    try {
      await axios.patch(`/api/servers/${server?.id}`, data)

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
      isStagedImageValueAction={isStagedValue}
      onCleanupStagedImageAction={cleanupStagedValue}
      onImageUploadCompleteAction={registerUploadedValue}
    />
  )
}
