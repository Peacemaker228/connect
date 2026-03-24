import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { utapi } from '@/lib/server/uploadthing'
import { UploadEndpoint } from '@/lib/shared/utils/upload-file'

export const runtime = 'nodejs'

const isUploadEndpoint = (value: FormDataEntryValue | null): value is UploadEndpoint => {
  return value === 'messageFile' || value === 'serverImage'
}

const isAllowedFile = (file: File, endpoint: UploadEndpoint) => {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'

  if (endpoint === 'serverImage') {
    return isImage
  }

  return isImage || isPdf
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const endpoint = formData.get('endpoint')
    const file = formData.get('file')

    if (!isUploadEndpoint(endpoint)) {
      return NextResponse.json({ error: 'Invalid upload endpoint' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!isAllowedFile(file, endpoint)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const result = await utapi.uploadFiles(file, {
      contentDisposition: 'inline',
    })

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error.message ?? 'Upload failed' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      key: result.data.key,
      name: result.data.name,
      size: result.data.size,
      type: file.type,
      url: result.data.ufsUrl ?? result.data.url,
    })
  } catch (error) {
    console.error('server-upload error', error)

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
