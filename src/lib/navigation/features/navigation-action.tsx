'use client'

import { Plus } from 'lucide-react'
import { ActionTooltip } from '@/lib/shared/features/action-tooltip'
import { useTranslations } from 'next-intl'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'

export const NavigationAction = () => {
  const { onOpen } = useModal()
  const t = useTranslations('NavSidebar')

  return (
    <div>
      <ActionTooltip side="right" align={'center'} label={t('AddServer')}>
        <button
          className="group flex items-center"
          onClick={() => {
            onOpen('createServer')
          }}>
          <div
            className={
              'flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-background dark:bg-neutral-700 group-hover:bg-mainOrange'
            }>
            <Plus className={'group-hover:text-white transition text-mainOrange'} size={25} />
          </div>
        </button>
      </ActionTooltip>
    </div>
  )
}
