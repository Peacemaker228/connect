'use client'

import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { Button } from '@/lib/shared/ui/button'
import { useJoinByInvite } from '@/lib/shared/data-access/server/api-socket'
import { ERoutes, getSignInRedirectUrl } from '@/lib/shared/utils/routes'
import { getDesktopInviteUrl } from '@/lib/shared/utils/desktop-deep-link'
import { getDesktopDownloadUrl } from '@/lib/shared/utils/desktop-download'

const InvitePage = () => {
  const router = useRouter()
  const { inviteCode } = useParams() as { inviteCode?: string }
  const { isLoaded, userId } = useAuth()
  const t = useTranslations('InvitePage')
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electron?.isDesktop)

  const hasJoinedRef = useRef(false)
  const hasTriedDesktopOpenRef = useRef(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { mutateAsync: joinByInvite, isError, isPending } = useJoinByInvite()
  const signInRedirectUrl = inviteCode ? getSignInRedirectUrl(`/invite/${inviteCode}`) : ERoutes.SIGN_IN
  const desktopInviteUrl = inviteCode ? getDesktopInviteUrl(inviteCode) : '#'

  useEffect(() => {
    if (!inviteCode || !isLoaded || isDesktop || hasTriedDesktopOpenRef.current) {
      return
    }

    hasTriedDesktopOpenRef.current = true

    const timeoutId = window.setTimeout(() => {
      window.location.href = desktopInviteUrl
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [desktopInviteUrl, inviteCode, isDesktop, isLoaded, userId])

  useEffect(() => {
    if (!inviteCode || hasJoinedRef.current || !isLoaded) {
      return
    }

    if (!isDesktop) {
      return
    }

    if (!userId && isDesktop) {
      hasJoinedRef.current = true
      setIsRedirecting(true)
      router.replace(signInRedirectUrl)
      return
    }

    hasJoinedRef.current = true

    const join = async () => {
      try {
        const { redirectUrl } = await joinByInvite(inviteCode)
        setIsRedirecting(true)
        router.replace(redirectUrl)
      } catch (error) {
        console.error('Invite failed:', error)

        if (axios.isAxiosError<{ redirectUrl?: string }>(error)) {
          const redirectUrl = error.response?.data?.redirectUrl

          if (redirectUrl) {
            setIsRedirecting(true)
            router.replace(redirectUrl)
            return
          }
        }

        setIsRedirecting(true)
        router.replace(ERoutes.MAIN_PAGE)
      }
    }

    void join()
  }, [inviteCode, isDesktop, isLoaded, joinByInvite, router, signInRedirectUrl, userId])

  const continueInBrowser = async () => {
    if (!inviteCode) {
      return
    }

    if (!userId) {
      setIsRedirecting(true)
      router.replace(signInRedirectUrl)
      return
    }

    try {
      const { redirectUrl } = await joinByInvite(inviteCode)
      setIsRedirecting(true)
      router.replace(redirectUrl)
    } catch (error) {
      console.error('Invite failed:', error)

      if (axios.isAxiosError<{ redirectUrl?: string }>(error)) {
        const redirectUrl = error.response?.data?.redirectUrl

        if (redirectUrl) {
          setIsRedirecting(true)
          router.replace(redirectUrl)
          return
        }
      }

      setIsRedirecting(true)
      router.replace(ERoutes.MAIN_PAGE)
    }
  }

  if (!isLoaded || isPending || isRedirecting) {
    return <Spinner />
  }

  if (!isDesktop && inviteCode) {
    return (
      <div className="min-h-full bg-[#121212] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b1f] p-6 text-white shadow-2xl">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{t('description')}</p>
          <p className="mt-3 text-xs leading-5 text-zinc-400">{t('desktopAccountHint')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button className="w-full" onClick={continueInBrowser}>
              {t('continueInBrowser')}
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href={desktopInviteUrl}>{t('openInDesktop')}</a>
            </Button>
            <Button asChild variant="link" className="w-full text-zinc-300">
              <a href={getDesktopDownloadUrl()} rel="noreferrer" target="_blank">
                {t('downloadDesktop')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorComponent />
  }

  return null
}

export default InvitePage
