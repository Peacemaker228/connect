import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

import { AuthEntrypointForm } from '@/lib/shared/features/auth-entrypoint-form'
import { currentProfile } from '@/lib/shared/utils/current-profile'

type AuthSearchParams = {
  mode?: string | string[]
  redirect_url?: string | string[]
}

const getSearchParam = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const redirectUrl = getSearchParam(resolvedSearchParams.redirect_url) ?? '/'
  const mode = getSearchParam(resolvedSearchParams.mode)
  const profile = await currentProfile()

  if (profile) {
    redirect(redirectUrl)
  }

  if (mode === 'clerk') {
    return <SignUp />
  }

  return <AuthEntrypointForm mode="register" />
}
