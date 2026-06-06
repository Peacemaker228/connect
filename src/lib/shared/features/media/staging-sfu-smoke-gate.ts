export const isTruthyEnvValue = (value: string | undefined) => {
  const normalizedValue = value?.trim().toLowerCase()

  return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes'
}

export const isStagingSfuSmokeGateEnabled = () =>
  isTruthyEnvValue(process.env.NEXT_PUBLIC_MEDIA_ENABLE_STAGING_SFU_SMOKE)
