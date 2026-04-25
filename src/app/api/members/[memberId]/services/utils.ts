export const validateMemberId = async (params: Promise<{ memberId: string }>): Promise<string | null> => {
  const { memberId } = await params

  return memberId ?? null
}
