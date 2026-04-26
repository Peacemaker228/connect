import { z } from 'zod'

export const authEntrypointSchema = z.object({
  name: z.string().trim().max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})
