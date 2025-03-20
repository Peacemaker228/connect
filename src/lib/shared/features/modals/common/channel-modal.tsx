import { FC } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/lib/shared/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/lib/shared/ui/form'
import { Input } from '@/lib/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/lib/shared/ui/select'
import { ChannelType } from '@prisma/client'
import { Button } from '@/lib/shared/ui/button'
import { z } from 'zod'
import { channelFormSchema } from '@/lib/channel/data-access/models/channelFormSchema'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'

interface IChannelModalProps {
  isOpen: boolean
  onClose: () => void
  form: UseFormReturn<z.infer<typeof channelFormSchema>>
  onSubmit: (data: z.infer<typeof channelFormSchema>) => Promise<void>
  isLoading: boolean
  type: 'create' | 'edit'
}

export const ChannelModal: FC<IChannelModalProps> = ({
  isOpen,
  onClose,
  form,
  onSubmit,
  isLoading,
  type = 'create',
}) => {
  const t = useTranslations('Modals.ChannelModal')
  const commonTrans = useTranslations('Common')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">
            {type === 'create' ? t('create') : t('edit')} {t('channel')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-grayBD">
                        {t('channelName')}
                      </FormLabel>
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
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-zinc-500 dark:text-grayBD uppercase">
                      {t('channelType')}
                      <Select disabled={isLoading} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="mt-2 bg-inherit border-[#121212] focus:ring-0 text-black dark:text-white ring-offset-0 focus:ring-offset-0 capitalize outline-none">
                            <SelectValue placeholder="Select a channel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="dark:bg-gray21">
                          {Object.values(ChannelType).map((t) => (
                            <SelectItem value={t} key={t} className="capitalize dark:focus:bg-mainOrange">
                              {commonTrans(`ChannelType.${t}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-gray-100 dark:bg-inherit px-6 py-4">
              <Button type="submit" variant="primary" disabled={isLoading} className={'w-full'}>
                {type === 'create' ? commonTrans('Create') : commonTrans('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
