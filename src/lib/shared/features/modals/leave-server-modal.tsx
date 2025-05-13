'use client'

import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button, Modal, Title } from '@axenix/ui-kit'

export const LeaveServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('Modals.LeaveServerModal')
  const commonTrans = useTranslations('Common')

  const isModalOpen = isOpen && type === 'leaveServer'

  const { server } = data

  const handleSubmit = async () => {
    if (!server) return

    try {
      setIsLoading(true)

      await axios.patch(`/api/socket/servers/${server.id}/leave`)

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
    <Modal
      isOpen={isModalOpen}
      onCancel={onClose}
      title={<Title level={2}>{t('title')}</Title>}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button disabled={isLoading} onClick={onClose}>
            {commonTrans('Cancel')}
          </Button>
          <Button
            disabled={isLoading}
            type="primary"
            className={'bg-red-500'}
            onClick={() => {
              return handleSubmit()
            }}>
            {commonTrans('Confirm')}
          </Button>
        </div>
      }>
      {t('description')} <span className="font-semibold text-mainOrange">{server?.name}</span>?
    </Modal>
  )
}
