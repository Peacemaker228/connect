'use client'

import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import qs from 'query-string'
import { DeleteModal } from '@/lib/shared/features/modals/common/delete-modal'

export const DeleteMessageModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === 'deleteMessage'

  const { apiUrl, query } = data

  const handleSubmit = async () => {
    if (!apiUrl || !query) return

    try {
      setIsLoading(true)

      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      })

      await axios.delete(url)

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
