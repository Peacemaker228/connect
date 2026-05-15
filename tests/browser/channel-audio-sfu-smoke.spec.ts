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
const transportQuery =
  process.env.CHANNEL_AUDIO_SFU_SMOKE_TRANSPORT === 'turn' ? '&sfuTransport=turn' : ''

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

  test('connects two authenticated channel AUDIO SFU participants behind explicit gate', async ({ browser }) => {
    test.setTimeout(90_000)

    const userOne = await browser.newContext()
    const userTwo = await browser.newContext()

    try {
      await registerUser(userOne, 'one')
      await registerUser(userTwo, 'two')
      const createdServer = await postJson<ServerResponse>(userOne, '/api/servers', {
        name: `channel-audio-sfu-smoke-${Date.now()}`,
        imageUrl: null,
      })

      await postJson(userTwo, '/api/invites/join', {
        inviteCode: createdServer.inviteCode,
      })

      const audioChannelName = `audio-sfu-${Date.now()}`
      const videoChannelName = `video-livekit-${Date.now()}`
      await postJson(userOne, `/api/channels?serverId=${createdServer.id}`, {
        name: audioChannelName,
        type: 'AUDIO',
      })
      await postJson(userOne, `/api/channels?serverId=${createdServer.id}`, {
        name: videoChannelName,
        type: 'VIDEO',
      })

      const serverWithChannels = await getJson<ServerResponse>(userOne, `/api/servers/${createdServer.id}`)
      const audioChannel = findChannel(serverWithChannels, audioChannelName, 'AUDIO')
      const videoChannel = findChannel(serverWithChannels, videoChannelName, 'VIDEO')
      const generalChannel = findChannel(serverWithChannels, 'general', 'TEXT')

      const userOnePage = await userOne.newPage()
      const userTwoPage = await userTwo.newPage()
      const sfuQuery = `?mediaProvider=sfu&sfuChannel=true${transportQuery}`

      await Promise.all([
        userOnePage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${sfuQuery}`),
        userTwoPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}${sfuQuery}`),
      ])

      await expect(userOnePage.getByTestId('private-sfu-provider')).toHaveText('SFU channel audio')
      await expect(userTwoPage.getByTestId('private-sfu-provider')).toHaveText('SFU channel audio')
      await expect(userOnePage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userTwoPage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userOnePage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        'Remote producers: 1',
      )
      await expect(userTwoPage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        'Remote producers: 1',
      )
      await expect(userOnePage.getByText('Requested media: audio on, video off')).toBeVisible()

      await userOnePage.getByRole('button', { name: 'Restart SFU channel audio' }).click()
      await expect(userOnePage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userTwoPage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        'Remote producers: 1',
        {
          timeout: 45_000,
        },
      )

      const defaultAudioPage = await userOne.newPage()
      await defaultAudioPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${audioChannel.id}`)
      await expect(defaultAudioPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      const gatedVideoPage = await userOne.newPage()
      await gatedVideoPage.goto(`${webBaseUrl}/servers/${createdServer.id}/channels/${videoChannel.id}${sfuQuery}`)
      await expect(gatedVideoPage.getByTestId('private-sfu-provider')).toHaveCount(0)

      await userOnePage.getByRole('button', { name: 'Leave call' }).click()
      await expect(userOnePage).toHaveURL(new RegExp(`/servers/${createdServer.id}/channels/${generalChannel.id}$`))
    } finally {
      await userOne.close()
      await userTwo.close()
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
