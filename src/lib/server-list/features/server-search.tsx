'use client'

import { FC, ReactElement, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TSearchType } from '@/types'
import { useTranslations } from 'next-intl'
import { Input, Modal, Text, Title, List, Space } from '@axenix/ui-kit'
import { SearchOutlined } from '@ant-design/icons'

export interface IServerData {
  label: string
  type: TSearchType
  data:
    | {
        icon: ReactElement | null
        name: string
        id: string
      }[]
    | undefined
}

interface IServerSearchProps {
  data: IServerData[]
}

export const ServerSearch: FC<IServerSearchProps> = ({ data }) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()
  const params = useParams()
  const t = useTranslations('ServerSidebar')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => {
      document.removeEventListener('keydown', down)
    }
  }, [])

  const handleClick = ({ id, type }: { id: string; type: 'channel' | 'member' }) => {
    setOpen(false)

    if (type === 'member') {
      return router.push(`/servers/${params?.serverId}/conversations/${id}`)
    }

    if (type === 'channel') {
      return router.push(`/servers/${params?.serverId}/channels/${id}`)
    }
  }

  const filteredData = useMemo(() => {
    return data
      .map((group) => ({
        ...group,
        data: group.data?.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase())),
      }))
      .filter((group) => group.data && group.data.length > 0)
  }, [data, searchValue])

  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
        }}
        className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
        <SearchOutlined className="text-zinc-500 dark:text-zinc-400" />
        <Text className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
          {t('Search.label')}
        </Text>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">CTRL</span>K
        </kbd>
      </button>

      <Modal isOpen={open} onCancel={() => setOpen(false)} footer={null} width={600} title={null} closable={false}>
        <Input
          placeholder={t('Search.placeholder')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          // TODO: fix ui kit
          // @ts-ignore
          prefix={<SearchOutlined />}
          size="large"
          style={{ marginBottom: '16px' }}
        />

        {filteredData.length === 0 ? (
          <Text type="secondary">No results found</Text>
        ) : (
          filteredData.map(({ label, type, data: innerData }) => (
            <div key={label} style={{ marginBottom: '16px' }}>
              <Title level={5} style={{ marginBottom: '8px' }}>
                {label}
              </Title>
              <List
                dataSource={innerData}
                renderItem={({ id, icon, name }) => (
                  <div
                    onClick={() => handleClick({ id, type })}
                    className="cursor-pointer p-2 hover:bg-mainOrange rounded-md">
                    <Space>
                      {icon}
                      <Text>{name}</Text>
                    </Space>
                  </div>
                )}
              />
            </div>
          ))
        )}
      </Modal>
    </>
  )
}
