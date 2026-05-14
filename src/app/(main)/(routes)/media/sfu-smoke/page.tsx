import { redirect } from 'next/navigation'
import { ERoutes } from '@app-core/routing/routes'

import { SfuSmokeHarness } from '@/lib/shared/features/media/sfu-smoke-harness'
import { getServerRouteGuardAuth } from '@/lib/shared/utils/server-route-guard'

const SfuSmokePage = async () => {
  if (process.env.NODE_ENV === 'production') {
    return redirect(ERoutes.MAIN_PAGE)
  }

  const auth = await getServerRouteGuardAuth()

  if (!auth) {
    return redirect(ERoutes.SIGN_IN)
  }

  return <SfuSmokeHarness />
}

export default SfuSmokePage
