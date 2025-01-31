import { deleteMember } from './services/deleteMember'
import { patchMember } from './services/patchMember'

export interface IMemberParams {
  params: Promise<{
    memberId: string
  }>
}

export const DELETE = (req: Request, context: IMemberParams) => deleteMember(req, context.params)
export const PATCH = (req: Request, context: IMemberParams) => patchMember(req, context.params)
