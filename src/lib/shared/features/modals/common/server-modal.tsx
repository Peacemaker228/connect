'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/lib/shared/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/lib/shared/ui/form'
import { FileUpload } from '@/lib/shared/features/file-upload'
import { Input } from '@/lib/shared/ui/input'
import { Button } from '@/lib/shared/ui/button'
import { FC } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { serverFormSchema } from '@/lib/shared/data-access/server/models/serverModalSchema'
import { useTranslations } from 'next-intl'

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
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center text-primary">{t('title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-8">
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
            <DialogFooter className="bg-gray-100 dark:bg-[#1E1E1E] px-6 py-4">
              <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
                {commonTrans('Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
