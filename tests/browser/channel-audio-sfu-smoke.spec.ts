import { expect, test, type BrowserContext } from '@playwright/test'

type AuthSnapshot = {
  session: {
    profile: {
      id: string
    } | null
  }
}

type ServerChannel = {
  id: string
  name: string
  serverId: string
  type: 'TEXT' | 'AUDIO' | 'VIDEO'
}

type ServerMember = {
  id: string
  profileId: string
  serverId: string
}

type ServerResponse = {
  id: string
  inviteCode: string
  channels: ServerChannel[]
  members: ServerMember[]
}

type MediasoupPrototypeHealth = {
  activeTransportCount?: number
  activeProducerCount?: number
  activeConsumerCount?: number
  activeRoomCount?: number
  trackedSessionCount?: number
  lastCleanup?: {
    staleSessionCount: number
    closedTransportCount: number
    closedProducerCount: number
    closedConsumerCount: number
  }
}

type MediasoupPrototypeProducerDiscovery = {
  producers: Array<{
    producerId: string
    participantSessionId: string
    paused: boolean
  }>
}

const isSmokeEnabled = process.env.CHANNEL_AUDIO_SFU_BROWSER_SMOKE === '1'
const smokeScheme = process.env.CHANNEL_AUDIO_SFU_SMOKE_SCHEME ?? process.env.PRIVATE_SFU_SMOKE_SCHEME ?? 'http'
const smokeHost = process.env.CHANNEL_AUDIO_SFU_SMOKE_HOST ?? process.env.PRIVATE_SFU_SMOKE_HOST ?? 'localhost'
const smokeApiPort = process.env.CHANNEL_AUDIO_SFU_SMOKE_API_PORT ?? process.env.PRIVATE_SFU_SMOKE_API_PORT ?? '4000'
const smokeWebPort = process.env.CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT ?? process.env.PRIVATE_SFU_SMOKE_WEB_PORT ?? '3000'
const apiBaseUrl = normalizeBaseUrl(
  process.env.CHANNEL_AUDIO_SFU_SMOKE_API_URL ??
    process.env.PRIVATE_SFU_SMOKE_API_URL ??
    `${smokeScheme}://${smokeHost}:${smokeApiPort}`,
)
const webBaseUrl = normalizeBaseUrl(
  process.env.CHANNEL_AUDIO_SFU_SMOKE_WEB_URL ??
    process.env.PRIVATE_SFU_SMOKE_WEB_URL ??
    `${smokeScheme}://${smokeHost}:${smokeWebPort}`,
)
const apiOrigin = new URL(apiBaseUrl)
const webOrigin = new URL(webBaseUrl)
const smokeTransport = process.env.CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT
const shouldUseCandidateGate = process.env.CHANNEL_AUDIO_SFU_SMOKE_CANDIDATE_GATE === '1'
const shouldUseProductDefaultPilot = process.env.CHANNEL_AUDIO_SFU_SMOKE_PRODUCT_DEFAULT_PILOT === '1'
const shouldUseImplicitSfuGate = shouldUseCandidateGate || shouldUseProductDefaultPilot
const participantCount = parsePositiveInteger(process.env.CHANNEL_AUDIO_SFU_SMOKE_USERS, 3)
const shouldRunLeaveRejoin = process.env.CHANNEL_AUDIO_SFU_SMOKE_LEAVE_REJOIN !== '0'
const shouldRunRouteChangeRejoin = process.env.CHANNEL_AUDIO_SFU_SMOKE_ROUTE_CHANGE_REJOIN !== '0'
const shouldRunPageReloadRejoin = process.env.CHANNEL_AUDIO_SFU_SMOKE_PAGE_RELOAD_REJOIN !== '0'
const shouldRunOfflineRestore = process.env.CHANNEL_AUDIO_SFU_SMOKE_OFFLINE_RESTORE === '1'
const shouldAssertCleanup = process.env.CHANNEL_AUDIO_SFU_SMOKE_ASSERT_CLEANUP === '1'
const cleanupSettleMs = parsePositiveInteger(process.env.CHANNEL_AUDIO_SFU_SMOKE_CLEANUP_SETTLE_MS, 25_000)

test.describe('channel AUDIO SFU browser smoke', () => {
  test.skip(!isSmokeEnabled, 'Set CHANNEL_AUDIO_SFU_BROWSER_SMOKE=1 with local API/web to run this smoke.')

  test.beforeAll(() => {
    expect(
      apiOrigin.hostname,
      [
        'CHANNEL_AUDIO_SFU_SMOKE_API_URL and CHANNEL_AUDIO_SFU_SMOKE_WEB_URL must use the same hostname',
        'so backend auth cookies set by the API request context are visible to the Next route guard.',
        `API: ${apiBaseUrl}`,
        `WEB: ${webBaseUrl}`,
        'Use CHANNEL_AUDIO_SFU_SMOKE_HOST=localhost or CHANNEL_AUDIO_SFU_SMOKE_HOST=127.0.0.1 for the whole smoke profile.',
      ].join(' '),
    ).toBe(webOrigin.hostname)
  })

  test('connects authenticated channel AUDIO SFU participants behind explicit, candidate, or product-default pilot gate', async ({
    browser,
  }) => {
    test.setTimeout(180_000)

    expect(participantCount, 'CHANNEL_AUDIO_SFU_SMOKE_USERS must be at least 2').toBeGreaterThanOrEqual(2)

    const contexts = await Promise.all(Array.from({ length: participantCount }, () => browser.newContext()))
    const observerContext = shouldAssertCleanup ? await browser.newContext() : null
    const [ownerContext, ...memberContexts] = contexts

    try {
      await Promise.all(contexts.map((context, index) => registerUser(context, String(index + 1))))
      if (observerContext) {
        await registerUser(observerContext, 'observer')
      }

      const createdServer = await postJson<ServerResponse>(ownerContext, '/api/servers', {
        name: `channel-audio-sfu-smoke-${Date.now()}`,
        imageUrl: null,
      })

      await Promise.all(
        memberContexts.map((context) =>
          postJson(context, '/api/invites/join', {
            inviteCode: createdServer.inviteCode,
          }),
        ),
      )

      const audioChannelName = `audio-sfu-${Date.now()}`
      const videoChannelName = `video-livekit-${Date.now()}`
      await postJson(ownerContext, `/api/channels?serverId=${createdServer.id}`, {
        name: audioChannelName,
        type: 'AUDIO',
      })
      await postJson(ownerContext, `/api/channels?serverId=${createdServer.id}`, {
        name: videoChannelName,
        type: 'VIDEO',
      })

      const serverWithChannels = await getJson<ServerResponse>(ownerContext, `/api/servers/${createdServer.id}`)
      const audioChannel = findChannel(serverWithChannels, audioChannelName, 'AUDIO')
      const videoChannel = findChannel(serverWithChannels, videoChannelName, 'VIDEO')
      const generalChannel = findChannel(serverWithChannels, 'general', 'TEXT')

      const pages = await Promise.all(contexts.map((context) => context.newPage()))
      const sfuQuery = toSearchQuery({
        mediaProvider: shouldUseImplicitSfuGate ? undefined : 'sfu',
        sfuChannel: shouldUseImplicitSfuGate ? undefined : 'true',
        sfuTransport: smokeTransport === 'turn' ? 'turn' : undefined,
      })
      const expectedRemoteProducerText = getRemoteProducerText(participantCount - 1)

      await Promise.all(
        pages.map((page) =>
          page.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${sfuQuery}`),
        ),
      )

      await expectAllProviders(pages, 'SFU channel audio')
      await expectAllStatuses(pages, 'connected')
      await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      await expectAllTransportModes(pages, smokeTransport === 'turn' ? 'Transport: turn' : 'Transport: direct')

      if (shouldUseImplicitSfuGate) {
        await Promise.all(
          pages.map((page) => expect(page.getByTestId('private-sfu-capture-mode')).toHaveText('Capture mode: real')),
        )
      }
      await expect(pages[0].getByText('Requested media: audio on, video off')).toBeVisible()
      await expect(pages[0].getByTestId('private-sfu-local-speaking')).toContainText('Local voice:')
      await expect(pages[0].getByTestId('private-sfu-remote-speaking')).toContainText('Remote voice:')

      const firstParticipantScope = await readParticipantScope(pages[0])

      await pages[0].getByTestId('private-sfu-audio-toggle').click()
      await expectProducerPaused(ownerContext, firstParticipantScope, true)
      await expect(pages[1].getByTestId('private-sfu-remote-speaking')).toHaveText('Remote voice: silent')

      await pages[0].getByTestId('private-sfu-audio-toggle').click()
      await expectProducerPaused(ownerContext, firstParticipantScope, false)

      if (shouldRunPageReloadRejoin) {
        await pages[0].reload()
        await expectAllStatuses(pages, 'connected')
        await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      }

      await pages[0].getByRole('button', { name: 'Restart SFU channel audio' }).click()
      await expectAllStatuses(pages, 'connected')
      await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)

      if (shouldRunOfflineRestore) {
        await contexts[1].setOffline(true)
        await pages[1].waitForTimeout(6_000)
        await contexts[1].setOffline(false)
        await expectAllStatuses(pages, 'connected')
        await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      }

      if (shouldRunLeaveRejoin) {
        const rejoiningPage = pages[participantCount - 1]

        await rejoiningPage.getByRole('button', { name: 'Leave call' }).click()
        await expect(rejoiningPage).toHaveURL(new RegExp(`/servers/${createdServer.id}/channels/${generalChannel.id}$`))
        await expectAllRemoteProducerCounts(
          pages.slice(0, participantCount - 1),
          getRemoteProducerText(participantCount - 2),
        )

        await rejoiningPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${sfuQuery}`)
        await expectAllStatuses(pages, 'connected')
        await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      }

      if (shouldRunRouteChangeRejoin) {
        const navigatingPage = pages[0]

        await navigatingPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${generalChannel.id}`)
        await expect(navigatingPage.getByTestId('private-sfu-provider')).toHaveCount(0)
        await expectAllRemoteProducerCounts(pages.slice(1), getRemoteProducerText(participantCount - 2))

        await navigatingPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${sfuQuery}`)
        await expectAllStatuses(pages, 'connected')
        await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      }

      const defaultAudioPage = await ownerContext.newPage()
      await defaultAudioPage.goto(
        `${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${
          shouldUseImplicitSfuGate ? '?mediaProvider=livekit' : ''
        }`,
      )
      await expect(defaultAudioPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const defaultVideoPage = await ownerContext.newPage()
      await defaultVideoPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}`)
      await expect(defaultVideoPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const gatedVideoPage = await ownerContext.newPage()
      await gatedVideoPage.goto(
        `${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}${
          shouldUseImplicitSfuGate ? '?mediaProvider=livekit' : sfuQuery
        }`,
      )
      await expect(gatedVideoPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      await pages[0].getByRole('button', { name: 'Leave call' }).click()
      await expect(pages[0]).toHaveURL(new RegExp(`/servers/${createdServer.id}/channels/${generalChannel.id}$`))

      if (observerContext) {
        await Promise.allSettled(pages.map((page) => page.close()))
        await Promise.allSettled(contexts.map((context) => context.close()))
        await expectPrototypeHealthSettled(observerContext, cleanupSettleMs)
      }
    } finally {
      await Promise.allSettled(contexts.map((context) => context.close()))
      await observerContext?.close().catch(() => undefined)
    }
  })
})

const registerUser = async (context: BrowserContext, label: string) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const response = await postJson<AuthSnapshot>(context, '/api/auth/register/password', {
    email: `channel-audio-sfu-${label}-${unique}@example.test`,
    password: 'Password123!',
    name: `Channel Audio SFU ${label} ${unique}`,
  })
  const profileId = response.session.profile?.id

  if (!profileId) {
    throw new Error(`Registered ${label} user did not return a profile id`)
  }

  return {
    profileId,
  }
}

const postJson = async <TResponse = unknown>(context: BrowserContext, path: string, data: unknown) => {
  const response = await context.request.post(toApiUrl(path), {
    data,
  })

  expect(response.ok(), `${path} should return success`).toBe(true)

  return (await response.json()) as TResponse
}

const getJson = async <TResponse>(context: BrowserContext, path: string) => {
  const response = await context.request.get(toApiUrl(path))

  expect(response.ok(), `${path} should return success`).toBe(true)

  return (await response.json()) as TResponse
}

const findChannel = (server: ServerResponse, name: string, type: ServerChannel['type']) => {
  const channel = server.channels.find((item) => item.name === name && item.type === type)

  if (!channel) {
    throw new Error(`Server ${server.id} does not include ${type} channel named ${name}`)
  }

  return channel
}

const expectAllProviders = async (pages: Awaited<ReturnType<BrowserContext['newPage']>>[], label: string) => {
  await Promise.all(pages.map((page) => expect(page.getByTestId('private-sfu-provider')).toHaveText(label)))
}

const expectAllStatuses = async (pages: Awaited<ReturnType<BrowserContext['newPage']>>[], status: string) => {
  await Promise.all(
    pages.map((page) =>
      expect(page.getByTestId('private-sfu-status')).toHaveText(status, {
        timeout: 45_000,
      }),
    ),
  )
}

const expectAllRemoteProducerCounts = async (pages: Awaited<ReturnType<BrowserContext['newPage']>>[], text: string) => {
  await Promise.all(
    pages.map((page) =>
      expect(page.getByTestId('private-sfu-remote-producer-count')).toHaveText(text, {
        timeout: 45_000,
      }),
    ),
  )
}

const expectAllTransportModes = async (pages: Awaited<ReturnType<BrowserContext['newPage']>>[], text: string) => {
  await Promise.all(pages.map((page) => expect(page.getByTestId('private-sfu-transport-mode')).toHaveText(text)))
}

const expectPrototypeHealthSettled = async (context: BrowserContext, settleMs: number) => {
  await expect
    .poll(
      async () => {
        const health = await getJson<MediasoupPrototypeHealth>(context, '/api/media/prototype/mediasoup/health')

        return {
          activeTransportCount: health.activeTransportCount ?? 0,
          activeProducerCount: health.activeProducerCount ?? 0,
          activeConsumerCount: health.activeConsumerCount ?? 0,
          activeRoomCount: health.activeRoomCount ?? 0,
          trackedSessionCount: health.trackedSessionCount ?? 0,
          cleanedSessionCount: health.lastCleanup?.staleSessionCount ?? 0,
        }
      },
      {
        message: 'stale SFU process-local resources should settle after browser context close',
        timeout: settleMs,
      },
    )
    .toEqual({
      activeTransportCount: 0,
      activeProducerCount: 0,
      activeConsumerCount: 0,
      activeRoomCount: 0,
      trackedSessionCount: 0,
      cleanedSessionCount: expect.any(Number),
    })
}

const readParticipantScope = async (page: Awaited<ReturnType<BrowserContext['newPage']>>) => {
  const roomId = (await page.getByTestId('private-sfu-room-id').textContent())?.trim()
  const participantSessionId = (await page.getByTestId('private-sfu-session-id').textContent())?.trim()
  const producerId = (await page.getByTestId('private-sfu-producer-id').textContent())?.trim()

  if (!roomId || !participantSessionId || !producerId || producerId === '-') {
    throw new Error('SFU participant scope is not visible in the channel AUDIO smoke UI')
  }

  return {
    roomId,
    participantSessionId,
    producerId,
  }
}

const expectProducerPaused = async (
  context: BrowserContext,
  scope: { roomId: string; participantSessionId: string; producerId: string },
  paused: boolean,
) => {
  await expect
    .poll(
      async () => {
        const discovery = await postJson<MediasoupPrototypeProducerDiscovery>(
          context,
          '/api/media/prototype/mediasoup/producers/discover',
          {
            roomId: scope.roomId,
            participantSessionId: scope.participantSessionId,
          },
        )
        const producer = discovery.producers.find((item) => item.producerId === scope.producerId)

        return producer?.paused
      },
      {
        message: `SFU producer ${scope.producerId} should be ${paused ? 'paused' : 'resumed'}`,
        timeout: 10_000,
      },
    )
    .toBe(paused)
}

function getRemoteProducerText(count: number) {
  return `Remote producers: ${count}`
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function toSearchQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()

  return query ? `?${query}` : ''
}

function toApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (apiBaseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${apiBaseUrl}${normalizedPath.slice('/api'.length)}`
  }

  return `${apiBaseUrl}${normalizedPath}`
}
