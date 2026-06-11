'use client'

import { useSyncExternalStore } from 'react'
import type { UnreadMessageCreatedRealtimePayload } from '@app-core/contracts'

export type ActiveChatReadState = {
  isNearBottom: boolean
  paramKey: 'channelId' | 'conversationId'
  paramValue: string
  serverId: string
}

const subscribers = new Set<() => void>()
let activeChatReadState: ActiveChatReadState | null = null

const notifySubscribers = () => {
  subscribers.forEach((subscriber) => subscriber())
}

const subscribe = (subscriber: () => void) => {
  subscribers.add(subscriber)

  return () => {
    subscribers.delete(subscriber)
  }
}

const getSnapshot = () => activeChatReadState

export const useActiveChatReadStateSnapshot = () => {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}

export const setActiveChatReadState = (state: ActiveChatReadState) => {
  activeChatReadState = state
  notifySubscribers()
}

export const clearActiveChatReadState = (state: Pick<ActiveChatReadState, 'paramKey' | 'paramValue' | 'serverId'>) => {
  if (!activeChatReadState) {
    return
  }

  if (
    activeChatReadState.serverId !== state.serverId ||
    activeChatReadState.paramKey !== state.paramKey ||
    activeChatReadState.paramValue !== state.paramValue
  ) {
    return
  }

  activeChatReadState = null
  notifySubscribers()
}

export const isActiveChatReadBoundary = (state: Pick<ActiveChatReadState, 'paramKey' | 'paramValue' | 'serverId'>) => {
  if (!activeChatReadState) {
    return false
  }

  return (
    activeChatReadState.serverId === state.serverId &&
    activeChatReadState.paramKey === state.paramKey &&
    activeChatReadState.paramValue === state.paramValue &&
    activeChatReadState.isNearBottom
  )
}

export const isUnreadPayloadAtActiveChatReadBoundary = (payload: UnreadMessageCreatedRealtimePayload) => {
  if (payload.scope === 'channel') {
    return isActiveChatReadBoundary({
      serverId: payload.serverId,
      paramKey: 'channelId',
      paramValue: payload.channelId,
    })
  }

  return isActiveChatReadBoundary({
    serverId: payload.serverId,
    paramKey: 'conversationId',
    paramValue: payload.conversationId,
  })
}
