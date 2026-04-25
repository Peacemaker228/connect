import type { ServerSliceRealtimeEvent } from '@app-core/contracts/server-slice-realtime'
import { NextApiResponseServerIo } from '@/types'

export const emitServerSliceRealtimeEvent = (
  res: NextApiResponseServerIo,
  event: ServerSliceRealtimeEvent,
) => {
  res.socket.server.io?.emit(event.key, event.payload)
}
