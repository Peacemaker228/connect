'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { ChannelType } from '@prisma/client'
import qs from 'query-string'
import { channelFormSchema } from '@/lib/channel/data-access/models/channelFormSchema'
import { useEffect } from 'react'
import { ChannelModal } from '@/lib/shared/features/modals/common/channel-modal'

export const EditChannelModal = () => {
  const router = useRouter()
  const { isOpen, onClose, type, data } = useModal()

  const { channel, server } = data

  const form = useForm({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: '',
      type: channel?.type || ChannelType.TEXT,
    },
  })

  const isModalOpen = isOpen && type === 'editChannel'

  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    if (channel) {
      form.setValue('name', channel.name, { shouldDirty: true })
      form.setValue('type', channel.type, { shouldDirty: true })
    }
  }, [channel, form])

  const handleSubmit = async (data: z.infer<typeof channelFormSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `/api/socket/channels/${channel?.id}`,
        query: {
          serverId: server?.id,
        },
      })

      await axios.patch(url, data)

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
      type={'edit'}
    />
  )
}
