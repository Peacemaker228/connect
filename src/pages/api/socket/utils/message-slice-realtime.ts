import type { MessageSliceRealtimeEvent } from '@app-core/contracts/message-slice-realtime'
import type { NextApiResponseServerIo } from '@/types'

export const emitMessageSliceRealtimeEvent = <TPayload>(
  res: NextApiResponseServerIo,
  event: MessageSliceRealtimeEvent<TPayload>,
) => {
  res.socket.server.io?.emit(event.key, event.payload)
}
