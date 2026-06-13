'use client'

import { ChangeEvent, DragEvent, FC, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FileIcon, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ImageUpload } from '@/lib/shared/ui/icons/components/ImageUpload'
import {
  buildStorageAccessPath,
  getUploadValueParts,
  serializeUploadValue,
  UploadEndpoint,
} from '@/lib/shared/utils/upload-file'
import { StorageActionError, uploadStorageFile } from '@sdk/actions/storage'

const MB_IN_BYTES = 1024 * 1024
const MESSAGE_FILE_MAX_SIZE_BYTES = 50 * MB_IN_BYTES
const SERVER_IMAGE_MAX_SIZE_BYTES = 4 * MB_IN_BYTES
const SINGLE_FILE_DROP_ERROR = 'Only one file can be uploaded at a time.'

interface IFileUploadProps {
  onChangeAction: (url?: string) => void
  value: string
  endpoint: UploadEndpoint
  isStagedValueAction?: (value: string) => boolean
  isActive?: boolean
  initialFile?: File
  onCleanupStagedValueAction?: (value: string) => Promise<unknown>
  onUploadCompleteAction?: (value: string) => void
  onUploadStateChangeAction?: (isUploading: boolean) => void
}

export const FileUpload: FC<IFileUploadProps> = ({
  endpoint,
  value,
  isActive = true,
  initialFile,
  onChangeAction,
  isStagedValueAction,
  onCleanupStagedValueAction,
  onUploadCompleteAction,
  onUploadStateChangeAction,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isActiveRef = useRef(isActive)
  const uploadedInitialFileRef = useRef<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const serverUploadTrans = useTranslations('Modals.ServerModal')
  const messageFileTrans = useTranslations('Modals.MessageFileModal')

  const { fileName, fileType, fileUrl } = getUploadValueParts(value, endpoint)
  const fileAccessPath = buildStorageAccessPath(value, endpoint)
  const displayFileName = fileName || fileUrl || 'Attachment'
  const uploadHelperLines =
    endpoint === 'messageFile'
      ? [serverUploadTrans('imageOne'), serverUploadTrans('imageTwo'), messageFileTrans('maxSize')]
      : [serverUploadTrans('imageOne'), serverUploadTrans('imageTwo')]

  useEffect(() => {
    isActiveRef.current = isActive

    if (!isActive) {
      setUploadError('')
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      isActiveRef.current = false
    }
  }, [])

  const handleRemoveFile = async () => {
    if (value && isStagedValueAction?.(value)) {
      try {
        await onCleanupStagedValueAction?.(value)
      } catch (error) {
        console.warn(error)
      }
    }

    onChangeAction('')
    setUploadError('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const getClientValidationError = useCallback(
    (file: File) => {
      const isImage = file.type.startsWith('image/')
      const maxFileSizeBytes = endpoint === 'messageFile' ? MESSAGE_FILE_MAX_SIZE_BYTES : SERVER_IMAGE_MAX_SIZE_BYTES

      if (endpoint === 'serverImage' && !isImage) {
        return 'Only images are allowed for server images.'
      }

      if (file.size > maxFileSizeBytes) {
        const maxFileSizeMb = maxFileSizeBytes / MB_IN_BYTES

        return `File is too large. Maximum size is ${maxFileSizeMb} MB.`
      }

      return ''
    },
    [endpoint],
  )

  const getUploadErrorMessage = useCallback((error: unknown) => {
    if (error instanceof StorageActionError && error.message) {
      if (error.message === 'File is too large') {
        return 'File is too large. Maximum size is 50 MB for message attachments and 4 MB for server images.'
      }

      return error.message
    }

    return 'File upload failed.'
  }, [])

  const uploadFile = useCallback(
    async (file: File) => {
      const clientValidationError = getClientValidationError(file)

      if (clientValidationError) {
        setUploadError(clientValidationError)
        return false
      }

      setUploadError('')
      setIsUploading(true)
      onUploadStateChangeAction?.(true)

      try {
        const uploadedFile = await uploadStorageFile(endpoint, file)

        const nextValue = serializeUploadValue({
          accessKind: uploadedFile.accessKind,
          fileKey: uploadedFile.key,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          fileUrl: uploadedFile.url,
        })

        if (value && nextValue !== value && isStagedValueAction?.(value)) {
          try {
            await onCleanupStagedValueAction?.(value)
          } catch (error) {
            console.warn(error)
          }
        }

        if (!isActiveRef.current) {
          onUploadCompleteAction?.(nextValue)

          try {
            await onCleanupStagedValueAction?.(nextValue)
          } catch (error) {
            console.warn(error)
          }

          return false
        }

        onUploadCompleteAction?.(nextValue)
        onChangeAction(nextValue)
        return true
      } catch (error) {
        console.warn(error)
        setUploadError(getUploadErrorMessage(error))
        return false
      } finally {
        if (isActiveRef.current) {
          setIsUploading(false)
        }
        onUploadStateChangeAction?.(false)
      }
    },
    [
      endpoint,
      getClientValidationError,
      getUploadErrorMessage,
      isStagedValueAction,
      onChangeAction,
      onCleanupStagedValueAction,
      onUploadCompleteAction,
      onUploadStateChangeAction,
      value,
    ],
  )

  useEffect(() => {
    if (!initialFile || uploadedInitialFileRef.current === initialFile) {
      return
    }

    uploadedInitialFileRef.current = initialFile
    void uploadFile(initialFile)
  }, [initialFile, uploadFile])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    const didUpload = await uploadFile(file)

    if (!didUpload) {
      event.target.value = ''
    }
  }

  const handleDragFile = (event: DragEvent<HTMLLabelElement>) => {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return
    }

    event.preventDefault()
  }

  const handleDropFile = async (event: DragEvent<HTMLLabelElement>) => {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return
    }

    event.preventDefault()

    const files = Array.from(event.dataTransfer.files)

    if (files.length === 0) {
      return
    }

    if (files.length > 1) {
      setUploadError(SINGLE_FILE_DROP_ERROR)
      return
    }

    const didUpload = await uploadFile(files[0])

    if (!didUpload && inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (value && fileType) {
    if (fileType.startsWith('image/')) {
      return (
        <div className="relative h-20 w-20" title={displayFileName}>
          <Image fill src={fileAccessPath} alt={displayFileName} unoptimized className="rounded-full object-cover" />
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
          <a
            href={fileAccessPath}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
            {displayFileName}
          </a>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="bg-rose-500 text-white rounded-full p-1 absolute -top-2 -right-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="relative flex max-w-md items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 shrink-0 fill-zinc-200 stroke-zinc-500 dark:fill-zinc-700 dark:stroke-zinc-300" />
        <a
          href={fileAccessPath}
          target={'_blank'}
          rel={'noopener noreferrer'}
          className="ml-2 min-w-0 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
          {displayFileName}
        </a>
        <button
          type="button"
          onClick={handleRemoveFile}
          className="bg-rose-500 text-white rounded-full p-1 absolute -top-2 -right-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <label
      onDragEnter={handleDragFile}
      onDragOver={handleDragFile}
      onDrop={handleDropFile}
      className={
        'border-[1px] border-dashed rounded-lg p-20 border-black dark:border-white cursor-pointer flex flex-col items-center justify-center gap-2'
      }>
      {isUploading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <>
          <ImageUpload />
          <div className={'flex flex-col text-primary gap-1'}>
            {uploadHelperLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={endpoint === 'serverImage' ? 'image/*' : undefined}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {uploadError && <p className="mt-3 max-w-sm text-center text-xs text-rose-500">{uploadError}</p>}
    </label>
  )
}
