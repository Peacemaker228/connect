'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { authEntrypointSchema } from '@app-core/schemas/auth-entrypoint-schema'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AuthActionError, loginWithPassword, registerWithPassword } from '@sdk/actions/auth'

import { Button } from '@/lib/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/shared/ui/form'
import { Input } from '@/lib/shared/ui/input'

type AuthEntrypointMode = 'login' | 'register'

type AuthEntrypointFormProps = {
  mode: AuthEntrypointMode
}

type AuthEntrypointFormValues = z.infer<typeof authEntrypointSchema>

const DEFAULT_REDIRECT_URL = '/'

export function AuthEntrypointForm({ mode }: AuthEntrypointFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl =
    searchParams?.get('redirect_url')?.trim() || DEFAULT_REDIRECT_URL
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<AuthEntrypointFormValues>({
    resolver: zodResolver(authEntrypointSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const isRegister = mode === 'register'
  const title = isRegister ? 'Create account' : 'Welcome back'
  const description = isRegister
    ? 'Create a backend-owned account and start a cookie-backed session.'
    : 'Sign in through the backend auth boundary using your existing account.'
  const submitLabel = isRegister ? 'Create account' : 'Sign in'
  const secondaryHref = isRegister ? '/sign-in' : '/sign-up'
  const secondaryLabel = isRegister
    ? 'Already have an account? Sign in'
    : 'Need an account? Sign up'

  const secondarySearchParams = new URLSearchParams()

  if (redirectUrl !== DEFAULT_REDIRECT_URL) {
    secondarySearchParams.set('redirect_url', redirectUrl)
  }

  const secondaryLink = `${secondaryHref}${
    secondarySearchParams.size > 0 ? `?${secondarySearchParams.toString()}` : ''
  }`

  const handleSubmit = async (values: AuthEntrypointFormValues) => {
    setErrorMessage(null)

    try {
      if (isRegister) {
        await registerWithPassword({
          name: values.name,
          email: values.email,
          password: values.password,
        })
      } else {
        await loginWithPassword({
          email: values.email,
          password: values.password,
        })
      }

      router.replace(redirectUrl)
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof AuthActionError ? error.message : 'Unable to complete authentication right now',
      )
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

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          {isRegister ? (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-neutral-300">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      disabled={form.formState.isSubmitting}
                      placeholder="Your name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-neutral-300">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    disabled={form.formState.isSubmitting}
                    placeholder="name@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-neutral-300">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    disabled={form.formState.isSubmitting}
                    placeholder="At least 8 characters"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMessage ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={form.formState.isSubmitting}
            type="submit">
            {form.formState.isSubmitting ? 'Please wait...' : submitLabel}
          </Button>
        </form>
      </Form>

      <div className="mt-6 space-y-3 text-sm text-neutral-300">
        <Link className="block hover:text-white" href={secondaryLink}>
          {secondaryLabel}
        </Link>
      </div>
    </div>
  )
}
