import { ChannelType } from '@prisma/client'

const ns = {
  langToggle: 'Изменить язык',
  loading: 'Загрузка',
  Chat: {
    loadMessages: 'Загрузка сообщений',
    error: 'Что-то пошло не так!',
  },
  role: {
    title: 'Роль',
    GUEST: 'ГОСТЬ',
    ADMIN: 'АДМИНИСТРАТОР',
    MODERATOR: 'МОДЕРАТОР',
  },
  ChannelType: {
    [ChannelType.TEXT]: 'Текстовый',
    [ChannelType.AUDIO]: 'Голосовой',
    [ChannelType.VIDEO]: 'Видео',
  },
  Create: 'Создать',
  Save: 'Сохранить',
  Cancel: 'Отменить',
  Confirm: 'Подтвердить',
  Send: 'Отправить',
  Subjects: {
    channel: 'Канал',
    server: 'Сервер',
    message: 'Сообщение',
  },
}

export default ns
