import { repo } from '@/lib/api/repository'

export type Template = {
  id: string
  title: string
  image_path: string
  is_free: boolean
  tags?: string[] | null
  required_entitlement?: string | null
  created_at: string
}

// Note: Server-only functions moved to `lib/templates.server.ts`

// Client-side create template with image upload
export async function createTemplate(input: {
  file: File
  title: string
  is_free: boolean
}): Promise<void> {
  await repo.catalog.createTemplate(input)
}

// Client-side update template (optionally replace image)
export async function updateTemplate(id: string, input: {
  file?: File
  title: string
  is_free: boolean
  required_entitlement?: string | null
}): Promise<void> {
  await repo.catalog.saveTemplate(id, input)
}

export async function deleteTemplate(id: string): Promise<void> {
  await repo.catalog.deleteTemplate(id)
}
