'use client'

import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/lib/shared/ui/spinner'
import { ErrorComponent } from '@/lib/shared/ui/error-component'
import { Button } from '@/lib/shared/ui/button'
import { useJoinByInvite } from '@/lib/shared/data-access/server/api-socket'
import { ERoutes, getSignInRedirectUrl } from '@app-core/routing/routes'
import { getDesktopInviteUrl } from '@/lib/shared/utils/desktop-deep-link'
import { getDesktopDownloadUrl } from '@/lib/shared/utils/desktop-download'

interface IInvitePageClientProps {
  inviteCode: string
  isValidInvite: boolean
  shouldAutoJoinInBrowser: boolean
}

export const InvitePageClient = ({
  inviteCode,
  isValidInvite,
  shouldAutoJoinInBrowser,
}: IInvitePageClientProps) => {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const t = useTranslations('InvitePage')
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electron?.isDesktop)

  const hasJoinedRef = useRef(false)
  const hasTriedDesktopOpenRef = useRef(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { mutateAsync: joinByInvite, isError, isPending } = useJoinByInvite()
  const desktopSignInRedirectUrl = getSignInRedirectUrl(`/invite/${inviteCode}`)
  const browserSignInRedirectUrl = getSignInRedirectUrl(`/invite/${inviteCode}?mode=browser`)
  const desktopInviteUrl = getDesktopInviteUrl(inviteCode)

  const joinInvite = useCallback(async () => {
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
  }, [inviteCode, joinByInvite, router])

  useEffect(() => {
    if (!isValidInvite) {
      return
    }

    if (!isLoaded || isDesktop || shouldAutoJoinInBrowser || hasTriedDesktopOpenRef.current) {
      return
    }

    hasTriedDesktopOpenRef.current = true

    const timeoutId = window.setTimeout(() => {
      window.location.href = desktopInviteUrl
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [desktopInviteUrl, isDesktop, isLoaded, isValidInvite, shouldAutoJoinInBrowser])

  useEffect(() => {
    if (!isValidInvite) {
      return
    }

    if (hasJoinedRef.current || !isLoaded) {
      return
    }

    if (isDesktop) {
      if (!userId) {
        hasJoinedRef.current = true
        setIsRedirecting(true)
        router.replace(desktopSignInRedirectUrl)
        return
      }

      hasJoinedRef.current = true
      void joinInvite()
      return
    }

    if (!shouldAutoJoinInBrowser) {
      return
    }

    if (!userId) {
      hasJoinedRef.current = true
      setIsRedirecting(true)
      router.replace(browserSignInRedirectUrl)
      return
    }

    hasJoinedRef.current = true
    void joinInvite()
  }, [
    browserSignInRedirectUrl,
    desktopSignInRedirectUrl,
    isDesktop,
    isLoaded,
    isValidInvite,
    joinInvite,
    router,
    shouldAutoJoinInBrowser,
    userId,
  ])

  const continueInBrowser = async () => {
    if (!isValidInvite) {
      return
    }

    if (!userId) {
      setIsRedirecting(true)
      router.replace(browserSignInRedirectUrl)
      return
    }

    await joinInvite()
  }

  if (!isLoaded || isPending || isRedirecting) {
    return <Spinner />
  }

  if (!isValidInvite) {
    return (
      <div className="min-h-full bg-[#121212] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b1f] p-6 text-white shadow-2xl">
          <h1 className="text-2xl font-semibold">{t('invalidTitle')}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{t('invalidDescription')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="w-full">
              <a href={ERoutes.MAIN_PAGE}>{t('backToHome')}</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorComponent />
  }

  if (!isDesktop && !shouldAutoJoinInBrowser) {
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

  if (isDesktop || shouldAutoJoinInBrowser) {
    return <Spinner />
  }

  return null
}
