import { redirect } from 'next/navigation'

import { AuthEntrypointForm } from '@/lib/shared/features/auth-entrypoint-form'
import { currentProfile } from '@/lib/shared/utils/current-profile'

type AuthSearchParams = {
  redirect_url?: string | string[]
}

const getSearchParam = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const redirectUrl = getSearchParam(resolvedSearchParams.redirect_url) ?? '/'
  const profile = await currentProfile()

  if (profile) {
    redirect(redirectUrl)
  }

  return <AuthEntrypointForm mode="login" />
}
