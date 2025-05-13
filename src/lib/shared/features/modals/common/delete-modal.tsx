import { FC } from 'react'

import { useTranslations } from 'next-intl'
import { Button, Modal, Paragraph, Title } from '@axenix/ui-kit'

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
    <Modal
      isOpen={isOpen}
      onCancel={onClose}
      title={
        <Title level={2}>
          {t('delete')} {commonTrans(`Subjects.${type}`)}
        </Title>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button disabled={isLoading} onClick={onClose} type="default">
            {commonTrans('Cancel')}
          </Button>
          <Button
            disabled={isLoading}
            type={'primary'}
            onClick={() => {
              return onSubmit()
            }}
            className={'bg-red-500'}>
            {commonTrans('Confirm')}
          </Button>
        </div>
      }>
      <Paragraph className="text-center text-zinc-500 dark:text-grayBD">
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
      </Paragraph>
    </Modal>
  )
}
