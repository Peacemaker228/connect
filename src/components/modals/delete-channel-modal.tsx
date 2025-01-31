'use client'

import axios from 'axios'
import { useModal } from '@/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import qs from 'query-string'
import { ERoutes } from '@/lib/routes'
import { DeleteModal } from '@/components/modals/common/delete-modal'

export const DeleteChannelModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isModalOpen = isOpen && type === 'deleteChannel'

  const { server, channel } = data

  const handleSubmit = async () => {
    if (!server) return

    try {
      setIsLoading(true)

      const url = qs.stringifyUrl({
        url: `/api/channels/${channel?.id}`,
        query: {
          serverId: server.id,
        },
      })

      await axios.delete(url)

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
