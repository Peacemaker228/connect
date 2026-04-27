'use client'

import { useCallback, useRef } from 'react'
import type { UploadEndpoint } from '@app-core/files/upload-file'
import { deleteUploadedFile } from '@/lib/shared/utils/delete-upload'

export const useStagedUpload = (endpoint: UploadEndpoint) => {
  const stagedValuesRef = useRef(new Set<string>())

  const registerUploadedValue = useCallback((value: string) => {
    if (!value) {
      return
    }

    stagedValuesRef.current.add(value)
  }, [])

  const isStagedValue = useCallback((value: string) => {
    return Boolean(value) && stagedValuesRef.current.has(value)
  }, [])

  const cleanupStagedValue = useCallback(
    async (value: string) => {
      if (!value || !stagedValuesRef.current.has(value)) {
        return false
      }

      await deleteUploadedFile(value, endpoint)
      stagedValuesRef.current.delete(value)

      return true
    },
    [endpoint],
  )

  const markCommitted = useCallback((value: string) => {
    if (!value) {
      return
    }

    stagedValuesRef.current.delete(value)
  }, [])

  const reset = useCallback(() => {
    stagedValuesRef.current.clear()
  }, [])

  return {
    cleanupStagedValue,
    isStagedValue,
    markCommitted,
    registerUploadedValue,
    reset,
  }
}
