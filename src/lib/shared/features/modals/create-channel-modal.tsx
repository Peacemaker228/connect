'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { ChannelType } from '@app-core/contracts'
import { channelFormSchema } from '@/lib/channel/data-access/models/channelFormSchema'
import { useEffect } from 'react'
import { ChannelModal } from '@/lib/shared/features/modals/common/channel-modal'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useCreateChannel } from '@sdk/mutations/channel'

export const CreateChannelModal = () => {
  const router = useRouter()
  const params = useParams<{ serverId?: string }>()
  const { isOpen, onClose, type, data } = useModal()
  const { mutateAsync: createChannel } = useCreateChannel()

  const { channelType } = data

  const form = useForm({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: '',
      type: channelType || ChannelType.TEXT,
    },
  })

  const isModalOpen = isOpen && type === 'createChannel'

  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    if (channelType) {
      form.setValue('type', channelType, { shouldDirty: true })
      return
    }

    form.setValue('type', ChannelType.TEXT, { shouldDirty: true })
  }, [channelType, form])

  const handleSubmit = async (data: z.infer<typeof channelFormSchema>) => {
    if (!params?.serverId) {
      return
    }

    try {
      await createChannel({ serverId: params.serverId, payload: data })

      form.reset()
      onClose()
      router.refresh()
    } catch (err) {
      console.log(err)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <ChannelModal
      isOpen={isModalOpen}
      onClose={handleClose}
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      type={'create'}
    />
  )
}
