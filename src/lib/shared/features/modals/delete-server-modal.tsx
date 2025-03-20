'use client'

import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteModal } from '@/lib/shared/features/modals/common/delete-modal'

export const DeleteServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === 'deleteServer'

  const { server } = data

  const handleSubmit = async () => {
    if (!server) return

    try {
      setIsLoading(true)

      await axios.delete(`/api/servers/${server.id}`)

      onClose()
      router.refresh()
      router.push('/')
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
      name={server?.name}
      type="server"
      isOpen={isModalOpen}
      isLoading={isLoading}
    />
  )
}
