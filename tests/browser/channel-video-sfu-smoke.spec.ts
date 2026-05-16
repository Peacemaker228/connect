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

const isSmokeEnabled = process.env.CHANNEL_VIDEO_SFU_BROWSER_SMOKE === '1'
const smokeScheme =
  process.env.CHANNEL_VIDEO_SFU_SMOKE_SCHEME ??
  process.env.CHANNEL_AUDIO_SFU_SMOKE_SCHEME ??
  process.env.PRIVATE_SFU_SMOKE_SCHEME ??
  'http'
const smokeHost =
  process.env.CHANNEL_VIDEO_SFU_SMOKE_HOST ??
  process.env.CHANNEL_AUDIO_SFU_SMOKE_HOST ??
  process.env.PRIVATE_SFU_SMOKE_HOST ??
  'localhost'
const smokeApiPort =
  process.env.CHANNEL_VIDEO_SFU_SMOKE_API_PORT ??
  process.env.CHANNEL_AUDIO_SFU_SMOKE_API_PORT ??
  process.env.PRIVATE_SFU_SMOKE_API_PORT ??
  '4000'
const smokeWebPort =
  process.env.CHANNEL_VIDEO_SFU_SMOKE_WEB_PORT ??
  process.env.CHANNEL_AUDIO_SFU_SMOKE_WEB_PORT ??
  process.env.PRIVATE_SFU_SMOKE_WEB_PORT ??
  '3000'
const apiBaseUrl = normalizeBaseUrl(
  process.env.CHANNEL_VIDEO_SFU_SMOKE_API_URL ??
    process.env.CHANNEL_AUDIO_SFU_SMOKE_API_URL ??
    process.env.PRIVATE_SFU_SMOKE_API_URL ??
    `${smokeScheme}://${smokeHost}:${smokeApiPort}`,
)
const webBaseUrl = normalizeBaseUrl(
  process.env.CHANNEL_VIDEO_SFU_SMOKE_WEB_URL ??
    process.env.CHANNEL_AUDIO_SFU_SMOKE_WEB_URL ??
    process.env.PRIVATE_SFU_SMOKE_WEB_URL ??
    `${smokeScheme}://${smokeHost}:${smokeWebPort}`,
)
const apiOrigin = new URL(apiBaseUrl)
const webOrigin = new URL(webBaseUrl)
const transportQuery =
  process.env.CHANNEL_VIDEO_SFU_SMOKE_TRANSPORT === 'turn' ? '&sfuTransport=turn' : ''
const participantCount = parsePositiveInteger(process.env.CHANNEL_VIDEO_SFU_SMOKE_USERS, 2)
const shouldRunLeaveRejoin = process.env.CHANNEL_VIDEO_SFU_SMOKE_LEAVE_REJOIN !== '0'

test.describe('channel VIDEO SFU browser smoke', () => {
  test.skip(!isSmokeEnabled, 'Set CHANNEL_VIDEO_SFU_BROWSER_SMOKE=1 with local API/web to run this smoke.')

  test.beforeAll(() => {
    expect(
      apiOrigin.hostname,
      [
        'CHANNEL_VIDEO_SFU_SMOKE_API_URL and CHANNEL_VIDEO_SFU_SMOKE_WEB_URL must use the same hostname',
        'so backend auth cookies set by the API request context are visible to the Next route guard.',
        `API: ${apiBaseUrl}`,
        `WEB: ${webBaseUrl}`,
        'Use CHANNEL_VIDEO_SFU_SMOKE_HOST=localhost or CHANNEL_VIDEO_SFU_SMOKE_HOST=127.0.0.1 for the whole smoke profile.',
      ].join(' '),
    ).toBe(webOrigin.hostname)
  })

  test('connects authenticated channel VIDEO SFU participants behind full explicit gate', async ({ browser }) => {
    test.setTimeout(120_000)

    expect(participantCount, 'CHANNEL_VIDEO_SFU_SMOKE_USERS must be at least 2').toBeGreaterThanOrEqual(2)

    const contexts = await Promise.all(
      Array.from({ length: participantCount }, () => browser.newContext()),
    )
    const [ownerContext, ...memberContexts] = contexts

    try {
      await Promise.all(contexts.map((context, index) => registerUser(context, String(index + 1))))
      const createdServer = await postJson<ServerResponse>(ownerContext, '/api/servers', {
        name: `channel-video-sfu-smoke-${Date.now()}`,
        imageUrl: null,
      })

      await Promise.all(
        memberContexts.map((context) =>
          postJson(context, '/api/invites/join', {
            inviteCode: createdServer.inviteCode,
          }),
        ),
      )

      const audioChannelName = `audio-livekit-${Date.now()}`
      const videoChannelName = `video-sfu-${Date.now()}`
      const noCameraVideoChannelName = `video-sfu-no-camera-${Date.now()}`

      await postJson(ownerContext, `/api/channels?serverId=${createdServer.id}`, {
        name: audioChannelName,
        type: 'AUDIO',
      })
      await postJson(ownerContext, `/api/channels?serverId=${createdServer.id}`, {
        name: videoChannelName,
        type: 'VIDEO',
      })
      await postJson(ownerContext, `/api/channels?serverId=${createdServer.id}`, {
        name: noCameraVideoChannelName,
        type: 'VIDEO',
      })

      const serverWithChannels = await getJson<ServerResponse>(ownerContext, `/api/servers/${createdServer.id}`)
      const audioChannel = findChannel(serverWithChannels, audioChannelName, 'AUDIO')
      const videoChannel = findChannel(serverWithChannels, videoChannelName, 'VIDEO')
      const noCameraVideoChannel = findChannel(serverWithChannels, noCameraVideoChannelName, 'VIDEO')
      const generalChannel = findChannel(serverWithChannels, 'general', 'TEXT')

      const pages = await Promise.all(contexts.map((context) => context.newPage()))
      const sfuQuery = `?mediaProvider=sfu&sfuChannel=true&sfuVideo=true&sfuCapture=real${transportQuery}`
      const expectedRemoteProducerText = getRemoteProducerText((participantCount - 1) * 2)
      const expectedRemoteVideoTileCount = participantCount - 1

      await Promise.all(
        pages.map((page) =>
          page.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}${sfuQuery}`),
        ),
      )

      await expectAllProviders(pages, 'SFU channel video')
      await expectAllStatuses(pages, 'connected')
      await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      await expect(pages[0].getByText('Requested media: audio on, video on')).toBeVisible()
      await expectAllLocalVideosVisible(pages)
      await expectAllRemoteVideoTileCounts(pages, expectedRemoteVideoTileCount)
      await expectAllRemoteVideosVisible(pages, expectedRemoteVideoTileCount)

      await pages[0].getByRole('button', { name: 'Restart SFU channel video' }).click()
      await expectAllStatuses(pages, 'connected')
      await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
      await expectAllRemoteVideoTileCounts(pages, expectedRemoteVideoTileCount)
      await expectAllRemoteVideosVisible(pages, expectedRemoteVideoTileCount)

      if (shouldRunLeaveRejoin) {
        const rejoiningPage = pages[participantCount - 1]
        const remainingPages = pages.slice(0, participantCount - 1)

        await rejoiningPage.getByRole('button', { name: 'Leave call' }).click()
        await expect(rejoiningPage).toHaveURL(
          new RegExp(`/servers/${createdServer.id}/channels/${generalChannel.id}$`),
        )
        await expectAllRemoteProducerCounts(remainingPages, getRemoteProducerText((participantCount - 2) * 2))
        await expectAllRemoteVideoTileCounts(remainingPages, participantCount - 2)

        await rejoiningPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}${sfuQuery}`)
        await expectAllStatuses(pages, 'connected')
        await expectAllRemoteProducerCounts(pages, expectedRemoteProducerText)
        await expectAllRemoteVideoTileCounts(pages, expectedRemoteVideoTileCount)
        await expectAllRemoteVideosVisible(pages, expectedRemoteVideoTileCount)
      }

      await pages[0].getByRole('button', { name: 'Leave call' }).click()
      await expect(pages[0]).toHaveURL(new RegExp(`/servers/${createdServer.id}/channels/${generalChannel.id}$`))
      await Promise.all(pages.map((page) => page.close()))

      const defaultVideoPage = await ownerContext.newPage()
      await defaultVideoPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}`)
      await expect(defaultVideoPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const partialGateVideoPage = await ownerContext.newPage()
      await partialGateVideoPage.goto(
        `${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}?mediaProvider=sfu&sfuChannel=true&sfuVideo=true`,
      )
      await expect(partialGateVideoPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const defaultAudioPage = await ownerContext.newPage()
      await defaultAudioPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}`)
      await expect(defaultAudioPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const noCameraContexts = contexts.slice(0, 2)
      const [noCameraPageOne, noCameraPageTwo] = await Promise.all(
        noCameraContexts.map((context) => context.newPage()),
      )
      const noCameraSfuQuery = `${sfuQuery}&sfuSimulateMissingCamera=true`

      await Promise.all([
        noCameraPageOne.goto(
          `${webBaseUrl}/servers/${createdServer.id}/channels/${noCameraVideoChannel.id}${noCameraSfuQuery}`,
        ),
        noCameraPageTwo.goto(
          `${webBaseUrl}/servers/${createdServer.id}/channels/${noCameraVideoChannel.id}${noCameraSfuQuery}`,
        ),
      ])

      await expectAllProviders([noCameraPageOne, noCameraPageTwo], 'SFU channel video')
      await expectAllStatuses([noCameraPageOne, noCameraPageTwo], 'connected')
      await expectAllRemoteProducerCounts([noCameraPageOne, noCameraPageTwo], 'Remote producers: 1')
      await expect(noCameraPageOne.getByTestId('private-sfu-capture-notice')).toHaveText(
        'Camera not found; continuing audio-only',
      )
      await expect(noCameraPageOne.getByRole('button', { name: 'Start camera' })).toBeDisabled()
    } finally {
      await Promise.all(contexts.map((context) => context.close()))
    }
  })
})

const registerUser = async (context: BrowserContext, label: string) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const response = await postJson<AuthSnapshot>(context, '/api/auth/register/password', {
    email: `channel-video-sfu-${label}-${unique}@example.test`,
    password: 'Password123!',
    name: `Channel Video SFU ${label} ${unique}`,
  })
  const profileId = response.session.profile?.id

  if (!profileId) {
    throw new Error(`Registered ${label} user did not return a profile id`)
  }

  return {
    profileId,
  }
}

const postJson = async <TResponse = unknown>(
  context: BrowserContext,
  path: string,
  data: unknown,
) => {
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

const expectAllStatuses = async (
  pages: Awaited<ReturnType<BrowserContext['newPage']>>[],
  status: string,
) => {
  await Promise.all(
    pages.map((page) =>
      expect(page.getByTestId('private-sfu-status')).toHaveText(status, {
        timeout: 45_000,
      }),
    ),
  )
}

const expectAllLocalVideosVisible = async (pages: Awaited<ReturnType<BrowserContext['newPage']>>[]) => {
  await Promise.all(pages.map((page) => expect(page.getByTestId('private-sfu-local-video')).toBeVisible()))
}

const expectAllRemoteProducerCounts = async (
  pages: Awaited<ReturnType<BrowserContext['newPage']>>[],
  text: string,
) => {
  await Promise.all(
    pages.map((page) =>
      expect(page.getByTestId('private-sfu-remote-producer-count')).toHaveText(text, {
        timeout: 45_000,
      }),
    ),
  )
}

const expectAllRemoteVideoTileCounts = async (
  pages: Awaited<ReturnType<BrowserContext['newPage']>>[],
  count: number,
) => {
  await Promise.all(
    pages.map((page) =>
      expect(page.getByTestId('private-sfu-remote-video-tile')).toHaveCount(count, {
        timeout: 45_000,
      }),
    ),
  )
}

const expectAllRemoteVideosVisible = async (
  pages: Awaited<ReturnType<BrowserContext['newPage']>>[],
  count: number,
) => {
  await Promise.all(
    pages.map(async (page) => {
      const remoteVideos = page.getByTestId('private-sfu-remote-video')

      await expect(remoteVideos).toHaveCount(count, {
        timeout: 45_000,
      })

      await Promise.all(
        Array.from({ length: count }, (_, index) => expect(remoteVideos.nth(index)).toBeVisible()),
      )
    }),
  )
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

function toApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (apiBaseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${apiBaseUrl}${normalizedPath.slice('/api'.length)}`
  }

  return `${apiBaseUrl}${normalizedPath}`
}
