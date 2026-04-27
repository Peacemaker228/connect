'use client'

import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'
import { DeleteModal } from '@/lib/shared/features/modals/common/delete-modal'
import { useDeleteChannel } from '@sdk/mutations/channel'

export const DeleteChannelModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { mutateAsync: deleteChannel } = useDeleteChannel()

  const isModalOpen = isOpen && type === 'deleteChannel'

  const { server, channel } = data

  const handleSubmit = async () => {
    if (!server || !channel?.id) return

    try {
      setIsLoading(true)

      await deleteChannel({ serverId: server.id, channelId: channel.id })

      onClose()

      router.push(`${ERoutes.SERVERS}/${server.id}`)
      router.refresh()
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DeleteModal
      onClose={onClose}
      onSubmit={handleSubmit}
      name={channel?.name}
      type="channel"
      isOpen={isModalOpen}
      isLoading={isLoading}
    />
  )
}
