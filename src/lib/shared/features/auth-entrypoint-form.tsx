'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { Button } from '@/lib/shared/ui/button'
import { Input } from '@/lib/shared/ui/input'

type AuthEntrypointMode = 'login' | 'register'

type AuthEntrypointFormProps = {
  mode: AuthEntrypointMode
}

type BackendErrorResponse = {
  message?: string | string[]
}

const DEFAULT_REDIRECT_URL = '/'

const getErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    const payload = (await response.json()) as BackendErrorResponse

    if (Array.isArray(payload.message)) {
      return payload.message[0] ?? 'Request failed'
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }
  }

  const text = await response.text()

  return text.trim() || 'Request failed'
}

export function AuthEntrypointForm({ mode }: AuthEntrypointFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl =
    searchParams?.get('redirect_url')?.trim() || DEFAULT_REDIRECT_URL
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === 'register'
  const submitPath = isRegister ? '/api/auth/register' : '/api/auth/login'
  const title = isRegister ? 'Create account' : 'Welcome back'
  const description = isRegister
    ? 'Backend-owned account creation is now the primary browser path.'
    : 'Sign in through the backend auth boundary first, with Clerk as fallback.'
  const submitLabel = isRegister ? 'Create account' : 'Sign in'
  const secondaryHref = isRegister ? '/sign-in' : '/sign-up'
  const secondaryLabel = isRegister
    ? 'Already have an account? Sign in'
    : 'Need an account? Sign up'

  const secondarySearchParams = new URLSearchParams()

  if (redirectUrl !== DEFAULT_REDIRECT_URL) {
    secondarySearchParams.set('redirect_url', redirectUrl)
  }

  const clerkSearchParams = new URLSearchParams(secondarySearchParams)
  clerkSearchParams.set('mode', 'clerk')

  const secondaryLink = `${secondaryHref}${
    secondarySearchParams.size > 0 ? `?${secondarySearchParams.toString()}` : ''
  }`
  const clerkFallbackLink = `?${
    clerkSearchParams.toString()
  }`

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch(submitPath, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          ...(isRegister ? { name } : {}),
          email,
          password,
        }),
      })

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
        return
      }

      router.replace(redirectUrl)
      router.refresh()
    } catch {
      setErrorMessage('Unable to complete authentication right now')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 p-8 text-white shadow-2xl backdrop-blur">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
          Ax Connect
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-6 text-neutral-300">{description}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isRegister ? (
          <div className="space-y-2">
            <label className="text-sm text-neutral-300" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              autoComplete="name"
              disabled={isSubmitting}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              value={name}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm text-neutral-300" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            autoComplete="email"
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-neutral-300" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            disabled={isSubmitting}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Please wait...' : submitLabel}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-sm text-neutral-300">
        <Link className="block hover:text-white" href={secondaryLink}>
          {secondaryLabel}
        </Link>
        <Link className="block text-neutral-400 hover:text-white" href={clerkFallbackLink}>
          Use Clerk fallback instead
        </Link>
      </div>
    </div>
  )
}
