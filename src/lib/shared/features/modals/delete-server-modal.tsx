'use client'

import axios from 'axios'
import { useModal } from '@/lib/shared/utils/hooks/use-modal-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteModal } from '@/lib/shared/features/modals/common/delete-modal'
import { ERoutes } from '@app-core/routing/routes'
import { useQueryClient } from '@tanstack/react-query'
import { Server } from '@prisma/client'

export const DeleteServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === 'deleteServer'

  const { server } = data

  const handleSubmit = async () => {
    if (!server) return

    try {
      setIsLoading(true)

      await axios.delete(`/api/servers/${server.id}`)

      const nextServers = queryClient.setQueryData<Server[]>(['servers'], (servers = []) => {
        return servers.filter((item) => item.id !== server.id)
      })

      queryClient.removeQueries({ queryKey: ['server', server.id], exact: true })
      queryClient.invalidateQueries({ queryKey: ['servers'] })

      const nextServerId = nextServers?.[0]?.id

      onClose()
      router.replace(nextServerId ? `${ERoutes.SERVERS}/${nextServerId}` : ERoutes.MAIN_PAGE)
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DeleteModal
      onClose={onClose}
      onSubmit={handleSubmit}
      name={server?.name}
      type="server"
      isOpen={isModalOpen}
      isLoading={isLoading}
    />
  )
}
