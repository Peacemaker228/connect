'use client'

import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { DeleteModal } from '@/lib/shared/features/modals/common/delete-modal'
import { useDeleteMessage } from '@sdk/mutations/message'

export const DeleteMessageModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: deleteMessage } = useDeleteMessage()

  const isModalOpen = isOpen && type === 'deleteMessage'

  const { apiUrl, query } = data

  const handleSubmit = async () => {
    if (!apiUrl || !query) return

    try {
      setIsLoading(true)

      await deleteMessage({ apiUrl, query })

      onClose()
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DeleteModal onClose={onClose} onSubmit={handleSubmit} type="message" isOpen={isModalOpen} isLoading={isLoading} />
  )
}
