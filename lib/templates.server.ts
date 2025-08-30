import { createServiceClient } from '@/lib/supabase/service';
import { Template } from './templates';
import { redirect } from 'next/navigation';

export async function fetchAllTemplates(): Promise<Template[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates.');
  }
  return data || [];
}

// Server helper: fetch a single template by ID
export async function fetchTemplateById(id: string): Promise<Template | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    // PostgREST code for no rows is PGRST116; treat as null
    if ((error as any).code === 'PGRST116') return null;
    console.error('Error fetching template by id:', error);
    throw new Error('Failed to fetch template');
  }
  return (data as Template) || null;
}

// Server action: create a template by converting PNG -> SVG wrapper and saving to storage + DB
export async function createTemplateFromUpload(formData: FormData): Promise<{ ok: true }>{
  'use server';
  const file = formData.get('file') as File | null;
  const title = (formData.get('title') as string) || '';
  const is_free = (formData.get('is_free') as string) === 'on' || formData.get('is_free') === 'true';
  const tagsRaw = (formData.get('tags') as string) || '';
  const required_entitlement_raw = (formData.get('required_entitlement') as string) || '';
  if (!file) throw new Error('No file provided');
  if (!title) throw new Error('Title is required');
  if (!is_free && !required_entitlement_raw.trim()) {
    throw new Error('Non-free templates require selecting an entitlement.');
  }
  // Basic validation
  if (file.type && !/^image\/(png|apng)$/i.test(file.type)) {
    throw new Error('Only PNG images are supported');
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size && file.size > maxBytes) {
    throw new Error('File too large (max 5MB)');
  }

  const supabase = createServiceClient();

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const pngBuffer = Buffer.from(arrayBuffer);
  const b64 = pngBuffer.toString('base64');

  // Minimal conversion: embed PNG as data URI inside SVG canvas sized to image natural size (if available)
  // Note: true vectorization can be added later (potrace/imagetracer). This preserves compatibility now.
  // Without decoding image dimensions server-side, we use a generic viewBox and preserveAspectRatio.
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">`+
    `<image href="data:image/png;base64,${b64}" x="0" y="0" width="100%" height="100%" />`+
    `</svg>`;
  const svgBuffer = Buffer.from(svgContent, 'utf-8');

  // Generate a storage path
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  const fileBase = `${safeTitle || 'template'}-${unique}`;
  const svgPath = `svgs/${fileBase}.svg`;

  // Upload SVG to templates bucket
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(svgPath, svgBuffer, {
      contentType: 'image/svg+xml',
      upsert: false,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  if (uploadError) {
    console.error('Upload SVG error:', uploadError);
    throw new Error('Failed to upload SVG');
  }

  // Insert DB row
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const { error: insertError } = await supabase
    .from('templates')
    .insert({
      title,
      image_path: svgPath,
      is_free,
      tags,
      required_entitlement: required_entitlement_raw.trim() || null,
    });
  if (insertError) {
    console.error('Insert template error:', insertError);
    throw new Error('Failed to save template');
  }

  // Redirect back to the templates admin listing after success
  redirect('/admin/templates');
  return { ok: true };
}

// Server action: delete a template and its associated storage files
export async function deleteTemplateAction(formData: FormData): Promise<{ ok: true }>{
  'use server';
  const id = (formData.get('id') as string) || '';
  if (!id) throw new Error('Template id is required');

  const supabase = createServiceClient();

  // Fetch existing row to know storage path
  const { data: row, error: fetchErr } = await supabase
    .from('templates')
    .select('image_path')
    .eq('id', id)
    .single();
  if (fetchErr) {
    console.error('Fetch template before delete error:', fetchErr);
    throw new Error('Failed to fetch template');
  }

  const pathsToDelete: string[] = [];
  if (row?.image_path) {
    pathsToDelete.push(row.image_path);
    // Optional heuristic: attempt to delete a sibling PNG/SVG with same basename
    const base = row.image_path.replace(/^.*\//, '').replace(/\.(svg|png)$/i, '');
    const dir = row.image_path.includes('/') ? row.image_path.split('/')[0] : '';
    const pngCandidate = `${dir ? dir + '/' : ''}${base}.png`;
    const svgCandidate = `${dir ? dir + '/' : ''}${base}.svg`;
    for (const candidate of [pngCandidate, svgCandidate]) {
      if (!pathsToDelete.includes(candidate)) pathsToDelete.push(candidate);
    }
  }

  if (pathsToDelete.length > 0) {
    const { error: removeErr } = await supabase.storage
      .from('templates')
      .remove(pathsToDelete);
    if (removeErr) {
      // Not fatal if some files are missing; log and continue
      console.warn('Storage remove warning:', removeErr);
    }
  }

  const { error: delErr } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);
  if (delErr) {
    console.error('Delete template row error:', delErr);
    throw new Error('Failed to delete template');
  }

  redirect('/admin/templates');
  return { ok: true };
}
