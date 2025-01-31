import { FC } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface IDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  onSubmit: () => Promise<void>
  name?: string
  type: 'channel' | 'server' | 'message'
}

export const DeleteModal: FC<IDeleteModalProps> = ({ isOpen, onClose, isLoading, onSubmit, name, type }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">
            Удалить {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Вы уверены, что хотите сделать это? <br />
            {type !== 'message' ? (
              <span className="font-semibold text-indigo-500">{type === 'channel' ? `#${name}` : name}</span>
            ) : (
              'Сообщение'
            )}{' '}
            будет удалено навсегда
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button disabled={isLoading} onClick={onClose} variant="ghost">
              Отменить
            </Button>
            <Button
              disabled={isLoading}
              variant="primary"
              onClick={() => {
                return onSubmit()
              }}>
              Подтвердить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
