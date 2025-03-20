'use client'

import { FC, useState } from 'react'
import '@uploadthing/react/styles.css'
import { UploadDropzone } from '@/lib/shared/utils/uploadthing'
import Image from 'next/image'
import { FileIcon, X } from 'lucide-react'
import { ClientUploadedFileData } from 'uploadthing/types'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ImageUpload } from '@/lib/shared/ui/icons/components/ImageUpload'

interface IFileUploadProps {
  onChangeAction: (url?: string) => void
  value: string
  endpoint: 'messageFile' | 'serverImage'
}

export const FileUpload: FC<IFileUploadProps> = ({ endpoint, value, onChangeAction }) => {
  const [fileType, setFileType] = useState<string | null>(null)
  const t = useTranslations('Modals.ServerModal')

  const handleUploadComplete = (res: ClientUploadedFileData<null>[]) => {
    if (res && res[0]) {
      onChangeAction(`${res[0].url}/${res[0].type}`)
      setFileType(res[0].type)
    }
  }

  const handleRemoveFile = () => {
    onChangeAction('')
    setFileType(null)
  }

  if (value && fileType) {
    if (fileType.startsWith('image')) {
      return (
        <div className="relative h-20 w-20">
          <Image fill src={value} alt="Upload" className="rounded-full" />
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
            href={value}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline overflow-wrap-anywhere">
            {value}
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
    <UploadDropzone
      className={'border-1 border-dashed rounded-lg p-20 border-black dark:border-white cursor-pointer'}
      endpoint={endpoint}
      onClientUploadComplete={handleUploadComplete}
      onUploadError={(err: Error) => {
        console.warn(err)
      }}
      content={{
        label: (
          <div className={'flex-col text-primary'}>
            <p>{t('imageOne')}</p>
            <p>{t('imageTwo')}</p>
          </div>
        ),
        uploadIcon: <ImageUpload />,
      }}
    />
  )
}
