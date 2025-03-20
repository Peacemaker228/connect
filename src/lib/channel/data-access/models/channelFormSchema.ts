import { z } from 'zod'
import { EGeneral } from '@/types'
import { ChannelType } from '@prisma/client'

export const channelFormSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: 'Channel name is required.',
    })
    .refine((name) => name.trim() !== EGeneral.GENERAL, { message: 'Channel name cannot be "general".' }),
  type: z.nativeEnum(ChannelType),
})
