import { IMemberParams } from '@/app/api/members/[memberId]/route'

export const validateMemberId = async (params: IMemberParams['params']): Promise<string | null> => {
  const { memberId } = await params

  return memberId ?? null
}
