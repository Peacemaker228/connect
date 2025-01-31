import { z } from 'zod'

export const chatInputSchema = z.object({
  content: z.string().min(1),
})

export type IChatInputSchema = z.infer<typeof chatInputSchema>
