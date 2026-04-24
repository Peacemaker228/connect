import { z } from 'zod'

export const messageFileSchema = z.object({
  fileUrl: z.string().min(1, {
    message: 'Attachment is required.',
  }),
})
