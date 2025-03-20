'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/shared/ui/dialog'
import { Input } from '@/lib/shared/ui/input'
import { Button } from '@/lib/shared/ui/button'
import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { Label } from '@/lib/shared/ui/label'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOrigin } from '@/lib/shared/utils/hooks/use-origin'

export const InviteModal = () => {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, onClose, type, data, onOpen } = useModal()
  const origin = useOrigin()
  const t = useTranslations('Modals.InviteModal')

  const isModalOpen = isOpen && type === 'invite'

  const { server } = data

  const inviteUrl = `${origin}/invite/${server?.inviteCode}`

  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  const onNew = async () => {
    try {
      setIsLoading(true)

      const res = await axios.patch(`/api/servers/${server?.id}/invite-code`)

      onOpen('invite', { server: res.data })
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
        </DialogHeader>
        <div className="p-6">
          <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-greyBD">{t('label')}</Label>
          <div className="flex items-center mt-2 gap-x-2">
            <Input
              disabled={isLoading}
              className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
              value={inviteUrl}
              onChange={() => {}}
            />
            <Button disabled={isLoading} size="icon" onClick={onCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={onNew}
            disabled={isLoading}
            variant={'link'}
            size={'sm'}
            className={'text-xs text-zinc-500 mt-4'}>
            {t('link')}
            <RefreshCw className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
