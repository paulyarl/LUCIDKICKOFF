import { createClient as createBrowserClient } from '@/lib/supabase/client'

export type Template = {
  id: string
  title: string
  image_path: string
  is_free: boolean
  tags: string[] | null
  required_entitlement?: string | null
  created_at: string
}

// Note: Server-only functions moved to `lib/templates.server.ts`

// Client-side create template with image upload
export async function createTemplate(input: {
  file: File
  title: string
  is_free: boolean
  tags: string[]
}): Promise<void> {
  const supabase = createBrowserClient()
  // 1) Upload file to storage 'templates' bucket
  const fileName = `${Date.now()}-${input.file.name}`
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(fileName, input.file, { upsert: false })
  if (uploadError) throw uploadError

  // 2) Insert row into public.templates
  const { error: insertError } = await supabase
    .from('templates')
    .insert({
      title: input.title,
      image_path: fileName,
      is_free: input.is_free,
      tags: input.tags,
    })
  if (insertError) throw insertError
}

// Client-side update template (optionally replace image)
export async function updateTemplate(id: string, input: {
  file?: File
  title: string
  is_free: boolean
  tags: string[]
  required_entitlement?: string | null
}): Promise<void> {
  const supabase = createBrowserClient()
  let image_path: string | undefined
  if (input.file) {
    const fileName = `${Date.now()}-${input.file.name}`
    const { error: uploadError } = await supabase.storage
      .from('templates')
      .upload(fileName, input.file, { upsert: false })
    if (uploadError) throw uploadError
    image_path = fileName
  }

  const { error } = await supabase
    .from('templates')
    .update({
      title: input.title,
      is_free: input.is_free,
      tags: input.tags,
      required_entitlement: input.required_entitlement ?? null,
      ...(image_path ? { image_path } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}
