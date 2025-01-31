'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { useModal } from '@/hooks/use-modal-store'
import { ChannelType } from '@prisma/client'
import qs from 'query-string'
import { channelFormSchema } from '@/models/channelFormSchema'
import { useEffect } from 'react'
import { ChannelModal } from '@/components/modals/common/channel-modal'

export const CreateChannelModal = () => {
  const router = useRouter()
  const params = useParams()
  const { isOpen, onClose, type, data } = useModal()

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
    try {
      const url = qs.stringifyUrl({
        url: '/api/channels',
        query: {
          serverId: params?.serverId,
        },
      })

      await axios.post(url, data)

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
