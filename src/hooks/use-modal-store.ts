import { create } from 'zustand'
import { Channel, ChannelType, Server } from '@prisma/client'

export type TModalType =
  | 'createServer'
  | 'invite'
  | 'editServer'
  | 'members'
  | 'createChannel'
  | 'leaveServer'
  | 'deleteServer'
  | 'deleteChannel'
  | 'editChannel'
  | 'messageFile'
  | 'deleteMessage'

interface IModalData {
  server?: Server
  channelType?: ChannelType
  channel?: Channel
  apiUrl?: string
  // может быть любое значение
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Record<string, any>
}

interface IModalStore {
  type: TModalType | null
  isOpen: boolean
  onOpen: (type: TModalType, data?: IModalData) => void
  onClose: () => void
  data: IModalData
}

export const useModal = create<IModalStore>((set) => ({
  type: null,
  isOpen: false,
  onOpen: (type: TModalType, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ isOpen: false, type: null }),
  data: {},
}))
