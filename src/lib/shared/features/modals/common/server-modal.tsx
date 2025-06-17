'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/lib/shared/ui/form'
import { FileUpload } from '@/lib/shared/features/file-upload'
import { Input } from '@/lib/shared/ui/input'
import { FC } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { serverFormSchema } from '@/lib/shared/data-access/server/models/serverModalSchema'
import { useTranslations } from 'next-intl'
import { Button, Modal, Title } from '@axenix/ui-kit'

interface IServerModalProps {
  isModalOpen?: boolean
  isLoading?: boolean
  onClose?: () => void
  onSubmitAction: (data: z.infer<typeof serverFormSchema>) => Promise<void>
  form: UseFormReturn<{ name: string; imageUrl: string }>
}

export const ServerModal: FC<IServerModalProps> = ({ isModalOpen, isLoading, onClose, onSubmitAction, form }) => {
  const t = useTranslations('Modals.ServerModal')
  const commonTrans = useTranslations('Common')

  return (
    <Modal
      isOpen={isModalOpen}
      onCancel={onClose}
      title={<Title level={2}>{t('title')}</Title>}
      footer={
        <Button
          onClick={form.handleSubmit(onSubmitAction)}
          htmlType="submit"
          type="primary"
          disabled={isLoading}
          className="w-full">
          {commonTrans('Create')}
        </Button>
      }>
      <Form {...form}>
        <form className="space-y-8">
          <div className="space-y-8 px-6">
            <div className="flex items-start justify-center text-center">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <FileUpload onChangeAction={field.onChange} endpoint="serverImage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-[#BDBDBD]">{t('name')}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        className="bg-inherit border-[#121212] focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0"
                        placeholder={t('namePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
        </form>
      </Form>
    </Modal>
  )
}
