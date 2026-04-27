'use client'

import { ChangeEvent, FC, useRef, useState } from 'react'
import Image from 'next/image'
import { FileIcon, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ImageUpload } from '@/lib/shared/ui/icons/components/ImageUpload'
import { buildStorageAccessPath, getUploadValueParts, serializeUploadValue, UploadEndpoint } from '@app-core/files/upload-file'

interface IFileUploadProps {
  onChangeAction: (url?: string) => void
  value: string
  endpoint: UploadEndpoint
  isStagedValueAction?: (value: string) => boolean
  onCleanupStagedValueAction?: (value: string) => Promise<unknown>
  onUploadCompleteAction?: (value: string) => void
}

export const FileUpload: FC<IFileUploadProps> = ({
  endpoint,
  value,
  onChangeAction,
  isStagedValueAction,
  onCleanupStagedValueAction,
  onUploadCompleteAction,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const t = useTranslations('Modals.ServerModal')

  const { fileType, fileUrl } = getUploadValueParts(value, endpoint)
  const fileAccessPath = buildStorageAccessPath(value, endpoint)

  const handleRemoveFile = async () => {
    if (value && isStagedValueAction?.(value)) {
      try {
        await onCleanupStagedValueAction?.(value)
      } catch (error) {
        console.warn(error)
      }
    }

    onChangeAction('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    if (endpoint === 'serverImage' && !isImage) {
      console.warn('Only images are allowed for serverImage')
      event.target.value = ''
      return
    }

    if (endpoint === 'messageFile' && !isImage && !isPdf) {
      console.warn('Only image or pdf are allowed for messageFile')
      event.target.value = ''
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('endpoint', endpoint)
      formData.append('file', file)

      const response = await fetch('/api/server-upload', {
        body: formData,
        method: 'POST',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? 'Upload failed')
      }

      const nextValue = serializeUploadValue({
        accessKind: json.accessKind,
        fileKey: json.key,
        fileType: json.type,
        fileUrl: json.url,
      })

      if (value && nextValue !== value && isStagedValueAction?.(value)) {
        try {
          await onCleanupStagedValueAction?.(value)
        } catch (error) {
          console.warn(error)
        }
      }

      onUploadCompleteAction?.(nextValue)
      onChangeAction(nextValue)
    } catch (error) {
      console.warn(error)
      event.target.value = ''
    } finally {
      setIsUploading(false)
    }
  }

  if (value && fileType) {
    if (fileType.startsWith('image')) {
      return (
        <div className="relative h-20 w-20">
          <Image fill src={fileAccessPath} alt="Upload" className="rounded-full object-cover" />
          <button
            type="button"
            onClick={handleRemoveFile}
            className="bg-rose-500 text-white rounded-full p-1 absolute top-0 right-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
          <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
          <Link
            href={fileAccessPath}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
            {fileUrl}
          </Link>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="bg-rose-500 text-white rounded-full p-1 absolute -top-2 -right-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }
  }

  return (
    <label
      className={
        'border-1 border-dashed rounded-lg p-20 border-black dark:border-white cursor-pointer flex flex-col items-center justify-center'
      }>
      {isUploading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <>
          <ImageUpload />
          <div className={'flex-col text-primary'}>
            <p>{t('imageOne')}</p>
            <p>{t('imageTwo')}</p>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={endpoint === 'serverImage' ? 'image/*' : 'image/*,.pdf,application/pdf'}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </label>
  )
}
