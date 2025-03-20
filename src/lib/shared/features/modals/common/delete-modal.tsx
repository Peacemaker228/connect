import { FC } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/shared/ui/dialog'
import { Button } from '@/lib/shared/ui/button'
import { useTranslations } from 'next-intl'

interface IDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  onSubmit: () => Promise<void>
  name?: string
  type: 'channel' | 'server' | 'message'
}

export const DeleteModal: FC<IDeleteModalProps> = ({ isOpen, onClose, isLoading, onSubmit, name, type }) => {
  const t = useTranslations('Modals.DeleteModal')
  const commonTrans = useTranslations('Common')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">
            {t('delete')} {commonTrans(`Subjects.${type}`)}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 dark:text-grayBD">
            {t('description')} <br />
            {type !== 'message' ? (
              <>
                <span>{type === 'channel' ? t('channel') : t('server')}</span>{' '}
                <span className="font-semibold text-mainOrange">{type === 'channel' ? `#${name}` : name}</span>
              </>
            ) : (
              t('message')
            )}{' '}
            {t('deleteWarning')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 dark:bg-inherit px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button disabled={isLoading} onClick={onClose} variant="ghost">
              {commonTrans('Cancel')}
            </Button>
            <Button
              disabled={isLoading}
              variant="red"
              onClick={() => {
                return onSubmit()
              }}>
              {commonTrans('Confirm')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
