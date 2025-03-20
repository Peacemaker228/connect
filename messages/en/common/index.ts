import { ChannelType } from '@prisma/client'

const ns = {
  langToggle: 'Toggle Language',
  loading: 'Loading',
  Chat: {
    loadMessages: 'Downloading messages',
    error: 'Something went wrong!',
  },
  role: {
    title: 'Role',
    GUEST: 'GUEST',
    ADMIN: 'ADMIN',
    MODERATOR: 'MODERATOR',
  },
  ChannelType: {
    [ChannelType.TEXT]: 'Text',
    [ChannelType.AUDIO]: 'Audio',
    [ChannelType.VIDEO]: 'Video',
  },
  Create: 'Create',
  Save: 'Save',
  Cancel: 'Cancel',
  Confirm: 'Confirm',
  Send: 'Send',
  Subjects: {
    channel: 'Channel',
    server: 'Server',
    message: 'Message',
  },
}

export default ns
