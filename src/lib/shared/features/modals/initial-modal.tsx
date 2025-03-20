'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { serverFormSchema } from '@/lib/shared/data-access/server/models/serverModalSchema'
import { ServerModal } from '@/lib/shared/features/modals/common/server-modal'

export const InitialModal = () => {
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: z.infer<typeof serverFormSchema>) => {
    try {
      await axios.post('/api/servers', data)

      form.reset()

      router.refresh()
      window.location.reload()
    } catch (err) {
      console.log(err)
    }
  }

  return <ServerModal form={form} onSubmitAction={handleSubmit} isLoading={isLoading} isModalOpen />
}
