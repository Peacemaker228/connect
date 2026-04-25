import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'

const ioHandler = (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(410).json({
    error: 'Socket transport moved to apps/api realtime gateway',
  })
}

export default ioHandler
