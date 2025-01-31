'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useModal } from '@/hooks/use-modal-store'
import { messageFileSchema } from '@/models/messageFileSchema'
import qs from 'query-string'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'

export const MessageFileModal = () => {
  const router = useRouter()
  const { isOpen, onClose, type, data } = useModal()

  const { apiUrl, query } = data

  const isModalOpen = isOpen && type === 'messageFile'

  const form = useForm<z.infer<typeof messageFileSchema>>({
    resolver: zodResolver(messageFileSchema),
    defaultValues: {
      fileUrl: '',
    },
  })

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: z.infer<typeof messageFileSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl ?? '',
        query,
      })

      await axios.post(url, { ...data, content: data.fileUrl })

      form.reset()

      router.refresh()
      onClose()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center">Add an attachment</DialogTitle>
          <DialogDescription className="text-zinc-500 text-center">Send a file as a message</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-start justify-center text-center">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <FileUpload onChangeAction={field.onChange} endpoint={'messageFile'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button type="submit" variant="primary" disabled={isLoading}>
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
