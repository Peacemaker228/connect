import { expect, test, type BrowserContext } from '@playwright/test'

type AuthSnapshot = {
  session: {
    profile: {
      id: string
    } | null
  }
}

type ServerMember = {
  id: string
  profileId: string
  serverId: string
}

type ServerResponse = {
  id: string
  inviteCode: string
  members: ServerMember[]
}

const isSmokeEnabled = process.env.PRIVATE_SFU_BROWSER_SMOKE === '1'
const smokeScheme = process.env.PRIVATE_SFU_SMOKE_SCHEME ?? 'http'
const smokeHost = process.env.PRIVATE_SFU_SMOKE_HOST ?? 'localhost'
const smokeApiPort = process.env.PRIVATE_SFU_SMOKE_API_PORT ?? '4000'
const smokeWebPort = process.env.PRIVATE_SFU_SMOKE_WEB_PORT ?? '3000'
const apiBaseUrl = normalizeBaseUrl(
  process.env.PRIVATE_SFU_SMOKE_API_URL ?? `${smokeScheme}://${smokeHost}:${smokeApiPort}`,
)
const webBaseUrl = normalizeBaseUrl(
  process.env.PRIVATE_SFU_SMOKE_WEB_URL ?? `${smokeScheme}://${smokeHost}:${smokeWebPort}`,
)
const apiOrigin = new URL(apiBaseUrl)
const webOrigin = new URL(webBaseUrl)
const transportQuery =
  process.env.PRIVATE_SFU_SMOKE_TRANSPORT === 'turn' ? '&sfuTransport=turn' : ''
const captureQuery =
  process.env.PRIVATE_SFU_SMOKE_CAPTURE === 'real-missing-camera'
    ? '&sfuCapture=real&sfuSimulateMissingCamera=true'
    : process.env.PRIVATE_SFU_SMOKE_CAPTURE === 'real'
      ? '&sfuCapture=real'
      : ''
const expectedRemoteProducerCount =
  process.env.PRIVATE_SFU_SMOKE_CAPTURE === 'real' ? 'Remote producers: 2' : 'Remote producers: 1'
const shouldRunNetworkInterruptionSmoke = process.env.PRIVATE_SFU_SMOKE_NETWORK_INTERRUPT === '1'

test.describe('private SFU two-user browser smoke', () => {
  test.skip(!isSmokeEnabled, 'Set PRIVATE_SFU_BROWSER_SMOKE=1 with local API/web to run this smoke.')

  test.beforeAll(() => {
    expect(
      apiOrigin.hostname,
      [
        'PRIVATE_SFU_SMOKE_API_URL and PRIVATE_SFU_SMOKE_WEB_URL must use the same hostname',
        'so backend auth cookies set by the API request context are visible to the Next route guard.',
        `API: ${apiBaseUrl}`,
        `WEB: ${webBaseUrl}`,
        'Use PRIVATE_SFU_SMOKE_HOST=localhost or PRIVATE_SFU_SMOKE_HOST=127.0.0.1 for the whole smoke profile.',
      ].join(' '),
    ).toBe(webOrigin.hostname)
  })

  test('connects two authenticated private SFU participants through media signaling', async ({ browser }) => {
    test.setTimeout(90_000)

    const userOne = await browser.newContext()
    const userTwo = await browser.newContext()

    try {
      const first = await registerUser(userOne, 'one')
      const second = await registerUser(userTwo, 'two')
      const createdServer = await postJson<ServerResponse>(userOne, '/api/servers', {
        name: `private-sfu-smoke-${Date.now()}`,
        imageUrl: null,
      })

      await postJson(userTwo, '/api/invites/join', {
        inviteCode: createdServer.inviteCode,
      })

      const serverForUserOne = await getJson<ServerResponse>(userOne, `/api/servers/${createdServer.id}`)
      const serverForUserTwo = await getJson<ServerResponse>(userTwo, `/api/servers/${createdServer.id}`)
      const userOneMember = findMember(serverForUserOne, first.profileId)
      const userTwoMember = findMember(serverForUserTwo, second.profileId)

      await postJson(
        userOne,
        `/api/direct-messages/conversations/${userTwoMember.id}?serverId=${createdServer.id}`,
        {},
      )

      const userOnePage = await userOne.newPage()
      const userTwoPage = await userTwo.newPage()
      const sfuQuery = `?video=true&mediaProvider=sfu${transportQuery}${captureQuery}`

      await Promise.all([
        userOnePage.goto(`${webBaseUrl}/servers/${createdServer.id}/conversations/${userTwoMember.id}${sfuQuery}`),
        userTwoPage.goto(`${webBaseUrl}/servers/${createdServer.id}/conversations/${userOneMember.id}${sfuQuery}`),
      ])

      await expect(userOnePage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userTwoPage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userOnePage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        expectedRemoteProducerCount,
      )
      await expect(userTwoPage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        expectedRemoteProducerCount,
      )

      if (shouldRunNetworkInterruptionSmoke) {
        await userOne.setOffline(true)
        await userOnePage.waitForTimeout(6_000)
        await userOne.setOffline(false)

        await expect(userOnePage.getByTestId('private-sfu-status')).toHaveText('connected', {
          timeout: 45_000,
        })
        await expect(userOnePage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
          expectedRemoteProducerCount,
          {
            timeout: 45_000,
          },
        )
      }

      await userOnePage.getByRole('button', { name: 'Restart SFU private call' }).click()
      await expect(userOnePage.getByTestId('private-sfu-status')).toHaveText('connected', {
        timeout: 45_000,
      })
      await expect(userTwoPage.getByTestId('private-sfu-remote-producer-count')).toHaveText(
        expectedRemoteProducerCount,
        {
          timeout: 45_000,
        },
      )

      if (process.env.PRIVATE_SFU_SMOKE_CAPTURE === 'real') {
        await expect(userOnePage.getByTestId('private-sfu-capture-mode')).toHaveText('Capture mode: real')
        await userOnePage.getByRole('button', { name: 'Mute microphone' }).click()
        await expect(userOnePage.getByRole('button', { name: 'Unmute microphone' })).toBeEnabled()
        await userOnePage.getByRole('button', { name: 'Stop camera' }).click()
        await expect(userOnePage.getByRole('button', { name: 'Start camera' })).toBeEnabled()
      }

      if (process.env.PRIVATE_SFU_SMOKE_CAPTURE === 'real-missing-camera') {
        await expect(userOnePage.getByTestId('private-sfu-capture-mode')).toHaveText('Capture mode: real')
        await expect(userOnePage.getByTestId('private-sfu-capture-notice')).toHaveText(
          'Camera not found; continuing audio-only',
        )
        await userOnePage.getByRole('button', { name: 'Mute microphone' }).click()
        await expect(userOnePage.getByRole('button', { name: 'Unmute microphone' })).toBeEnabled()
        await expect(userOnePage.getByRole('button', { name: 'Start camera' })).toBeDisabled()
      }

      const defaultPrivatePage = await userOne.newPage()

      await defaultPrivatePage.goto(
        `${webBaseUrl}/servers/${createdServer.id}/conversations/${userTwoMember.id}?video=true`,
      )
      await expect(defaultPrivatePage.getByTestId('private-sfu-provider')).toHaveCount(0)

      await userOnePage.getByRole('button', { name: 'Leave call' }).click()
      await expect(userOnePage).toHaveURL(
        new RegExp(`/servers/${createdServer.id}/conversations/${userTwoMember.id}$`),
      )
    } finally {
      await userOne.close()
      await userTwo.close()
    }
  })
})

const registerUser = async (context: BrowserContext, label: string) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const response = await postJson<AuthSnapshot>(context, '/api/auth/register/password', {
    email: `private-sfu-${label}-${unique}@example.test`,
    password: 'Password123!',
    name: `Private SFU ${label} ${unique}`,
  })
  const profileId = response.session.profile?.id

  if (!profileId) {
    throw new Error(`Registered ${label} user did not return a profile id`)
  }

  return {
    profileId,
  }
}

const getJson = async <TResponse>(context: BrowserContext, path: string) => {
  const response = await context.request.get(toApiUrl(path))

  expect(response.ok(), `${path} should return success`).toBe(true)

  return (await response.json()) as TResponse
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

const findMember = (server: ServerResponse, profileId: string) => {
  const member = server.members.find((item) => item.profileId === profileId)

  if (!member) {
    throw new Error(`Server ${server.id} does not include member for profile ${profileId}`)
  }

  return member
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
