'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/shared/ui/dialog'
import { Button } from '@/lib/shared/ui/button'
import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

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
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">{t('title')}</DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            {t('description')} <span className="font-semibold text-mainOrange">{server?.name}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 dark:bg-inherit px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button disabled={isLoading} onClick={onClose} variant="ghost">
              {commonTrans('Cancel')}
            </Button>
            <Button
              disabled={isLoading}
              variant="primary"
              onClick={() => {
                return handleSubmit()
              }}>
              {commonTrans('Confirm')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
