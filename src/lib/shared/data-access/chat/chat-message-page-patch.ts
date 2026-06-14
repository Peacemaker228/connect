import type { ChatMessageDto, MessageReplyPreviewDto } from '@app-core/contracts'

type ChatMessagesPageLike = {
  items: ChatMessageDto[]
}

const toReplyPreview = (message: ChatMessageDto): MessageReplyPreviewDto => ({
  id: message.id,
  content: message.content,
  createdAt: message.createdAt,
  deleted: message.deleted,
  fileUrl: message.fileUrl,
  member: message.member,
  memberId: message.memberId,
  mentions: message.mentions,
})

const shouldRefreshReplyPreview = (item: ChatMessageDto, updatedMessageId: string) =>
  item.replyTo?.id === updatedMessageId ||
  item.replyToMessageId === updatedMessageId ||
  item.replyToDirectMessageId === updatedMessageId

export const patchChatMessagesPages = <TPage extends ChatMessagesPageLike>(
  pages: TPage[],
  updatedMessage: ChatMessageDto,
) => {
  let didPatch = false

  const patchedPages = pages.map((page) => {
    let didPatchPage = false
    const patchedItems = page.items.map((item) => {
      if (item.id === updatedMessage.id) {
        didPatch = true
        didPatchPage = true
        return updatedMessage
      }

      if (shouldRefreshReplyPreview(item, updatedMessage.id)) {
        didPatch = true
        didPatchPage = true
        return {
          ...item,
          replyTo: toReplyPreview(updatedMessage),
        }
      }

      return item
    })

    if (!didPatchPage) {
      return page
    }

    return {
      ...page,
      items: patchedItems,
    }
  })

  return didPatch ? patchedPages : pages
}
