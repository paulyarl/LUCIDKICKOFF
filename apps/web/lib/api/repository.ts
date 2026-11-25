import { createClient } from '@/lib/supabase/client';

/**
 * S4.1 — client-side repository facade.
 *
 * Views and components call `repo.<domain>.<method>` instead of touching the
 * Supabase client directly. All queries run under the user's own JWT via the
 * browser client, so RLS still enforces every scope rule — the facade only
 * centralizes query shapes behind `lib/api`.
 */

type SB = ReturnType<typeof createClient>;

async function requireUser(sb: SB) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

async function requireSession(sb: SB) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session;
}

export type FamilyChild = {
  id: string; // auth child id when available, else profile id
  childProfileId: string;
  email: string; // nickname, kept for caller compatibility
  avatarUrl?: string | null;
  birthdate?: string | null;
};

export type TemplateRow = {
  id: string;
  title: string;
  image_path: string;
  is_free?: boolean | null;
  tags?: string[] | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  pack_id?: string | null;
  guide?: unknown;
};

export type PackRow = {
  id: string;
  slug: string;
  title: string;
  title_i18n?: Record<string, string> | null;
  description_i18n?: Record<string, string> | null;
  cover_path?: string | null;
  is_free?: boolean | null;
  age_band?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  status?: string | null;
};

function sb(): SB {
  return createClient();
}

export const repo = {
  /** Auth/session reads — keeps views off the Supabase client entirely. */
  auth: {
    async user() {
      const { data: { user } } = await sb().auth.getUser();
      return user;
    },
    async session() {
      const { data: { session } } = await sb().auth.getSession();
      return session;
    },
    async signOut() {
      await sb().auth.signOut();
    },
  },

  family: {
    async listChildren(): Promise<FamilyChild[]> {
      const user = await requireUser(sb());
      const { data: guardianRows, error } = await sb()
        .from('child_guardians')
        .select('child_profile_id, child_profiles!inner(id, nickname, avatar_url, auth_user_id, birthdate)')
        .eq('guardian_id', user.id);
      if (error) throw error;

      const mapped = (guardianRows ?? [])
        .map((row: any) => {
          const profile = Array.isArray(row.child_profiles) ? row.child_profiles[0] : row.child_profiles;
          if (!profile) return null;
          return {
            id: profile.auth_user_id ?? profile.id,
            childProfileId: profile.id,
            email: profile.nickname ?? 'Learner',
            avatarUrl: profile.avatar_url ?? null,
            birthdate: profile.birthdate ?? null,
          };
        })
        .filter(Boolean) as FamilyChild[];
      if (mapped.length > 0) return mapped;

      // Legacy fallback until every family has child_guardians rows.
      const { data, error: legacyError } = await sb()
        .from('family_relationships')
        .select('child_id')
        .eq('parent_id', user.id);
      if (legacyError) throw legacyError;
      const childIds = (data ?? []).map((r: any) => r.child_id);
      if (childIds.length === 0) return [];

      const { data: profiles, error: profErr } = await sb()
        .from('profiles')
        .select('id, full_name, username')
        .in('id', childIds);
      if (profErr) throw profErr;
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return childIds.map((id) => {
        const prof: any = byId.get(id);
        const display = prof?.full_name?.trim() || prof?.username?.trim() || id;
        return { id, childProfileId: id, email: display };
      });
    },

    async assignPack(childId: string, packId: string) {
      const { data, error } = await sb()
        .from('child_pack_assignments')
        .insert({ child_id: childId, pack_id: packId, assigned_by: undefined })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    async assignTemplate(childId: string, storageRef: string) {
      const { data, error } = await sb()
        .from('child_template_assignments')
        .insert({ child_id: childId, storage_ref: storageRef, assigned_by: undefined })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    async statsForProfiles(profileIds: string[]) {
      if (profileIds.length === 0) return { packs: 0, lessons: 0, artworks: 0, packsByChild: {} as Record<string, number> };
      const client = sb();
      const [packs, lessons, artworks, packRows] = await Promise.all([
        client.from('child_pack_assignments').select('*', { count: 'exact', head: true }).in('child_profile_id', profileIds),
        client.from('user_lesson_progress').select('*', { count: 'exact', head: true }).in('child_profile_id', profileIds),
        client.from('artworks').select('*', { count: 'exact', head: true }).in('child_profile_id', profileIds),
        client.from('child_pack_assignments').select('child_profile_id').in('child_profile_id', profileIds),
      ]);
      const packsByChild: Record<string, number> = {};
      (packRows.data ?? []).forEach((row: any) => {
        packsByChild[row.child_profile_id] = (packsByChild[row.child_profile_id] ?? 0) + 1;
      });
      return { packs: packs.count ?? 0, lessons: lessons.count ?? 0, artworks: artworks.count ?? 0, packsByChild };
    },

    async createChildProfile(input: { nickname: string; birthdate: string | null; avatar_url: string }) {
      const { error } = await sb().rpc('create_child_profile', {
        p_nickname: input.nickname,
        p_birthdate: input.birthdate,
        p_avatar_url: input.avatar_url,
      });
      if (error) throw error;
    },

    async assignedPacksForChild(childId: string) {
      const { data, error } = await sb()
        .from('child_pack_assignments')
        .select('pack_id')
        .eq('child_id', childId);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.pack_id as string);
    },

    async assignedTemplatesForChild(childId: string): Promise<string[]> {
      const { data, error } = await sb()
        .from('child_template_assignments')
        .select('storage_ref')
        .eq('child_id', childId);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.storage_ref as string);
    },

    async unassignPack(childId: string, packId: string) {
      const { error } = await sb()
        .from('child_pack_assignments')
        .delete()
        .eq('child_id', childId)
        .eq('pack_id', packId);
      if (error) throw error;
    },

    async unassignTemplate(childId: string, storageRef: string) {
      const { error } = await sb()
        .from('child_template_assignments')
        .delete()
        .eq('child_id', childId)
        .eq('storage_ref', storageRef);
      if (error) throw error;
    },

    async packAssignments(childId?: string) {
      let q = sb().from('child_pack_assignments').select('*');
      if (childId) q = q.eq('child_id', childId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async generateOtp(): Promise<{ otp: string; expires_at: string }> {
      const session = await requireSession(sb());
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to generate OTP');
      return res.json();
    },

    async linkChild(otp: string): Promise<{ success: boolean; child_id?: string }> {
      const session = await requireSession(sb());
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/link-child`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to link child');
      return res.json();
    },

    async approvalRequests() {
      const session = await requireSession(sb());
      const { data, error } = await sb()
        .from('approval_requests')
        .select('*')
        .eq('parent_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async relationships() {
      const session = await requireSession(sb());
      const { data, error } = await sb()
        .from('family_relationships')
        .select('*')
        .eq('parent_id', session.user.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async linkedChildren() {
      const session = await requireSession(sb());
      const { data, error } = await sb()
        .from('family_relationships')
        .select('child:child_id(id, username)')
        .eq('parent_id', session.user.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async pendingApprovalRequests() {
      const session = await requireSession(sb());
      const { data, error } = await sb()
        .from('approval_requests')
        .select('*, profiles:child_id (username)')
        .eq('parent_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((item: any) => ({
        ...item,
        child_username: item.profiles?.username || 'Your child',
      }));
    },

    pins: {
      async get() {
        const user = await requireUser(sb());
        const { data, error } = await sb().from('parent_pins').select('*').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        return data ?? null;
      },
      async upsert(values: Record<string, any>) {
        const user = await requireUser(sb());
        const { error } = await sb().from('parent_pins').upsert({ user_id: user.id, ...values });
        if (error) throw error;
      },
      async update(patch: Record<string, any>) {
        const user = await requireUser(sb());
        const { error } = await sb().from('parent_pins').update(patch).eq('user_id', user.id);
        if (error) throw error;
      },
      async delete() {
        const user = await requireUser(sb());
        const { error } = await sb().from('parent_pins').delete().eq('user_id', user.id);
        if (error) throw error;
      },
    },
  },

  catalog: {
    async packs(opts: { order?: string; columns?: string } = {}): Promise<PackRow[]> {
      const { data, error } = await sb()
        .from('packs')
        .select(opts.columns ?? 'id, slug, title, title_i18n, description_i18n, cover_path, is_free, age_band, rating_avg, rating_count')
        .order(opts.order ?? 'created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PackRow[];
    },

    async packById(id: string): Promise<PackRow | null> {
      const { data, error } = await sb().from('packs').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data as PackRow | null) ?? null;
    },

    async packBySlug(slug: string): Promise<PackRow | null> {
      const { data, error } = await sb().from('packs').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return (data as PackRow | null) ?? null;
    },

    async packsByIds(ids: string[], columns?: string): Promise<PackRow[]> {
      if (ids.length === 0) return [];
      const { data, error } = await sb().from('packs').select(columns ?? '*').in('id', ids);
      if (error) throw error;
      return (data ?? []) as PackRow[];
    },

    async packItems(packId: string, kind?: string) {
      let q = sb().from('pack_items').select('*').eq('pack_id', packId);
      if (kind) q = q.eq('kind', kind);
      const { data, error } = await q.order('position', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async createPackItem(input: {
      pack_id: string;
      kind: 'lesson' | 'tutorial' | 'template';
      ref_id: string;
      position?: number;
      metadata?: Record<string, any> | null;
    }) {
      const { data, error } = await sb()
        .from('pack_items')
        .insert({
          pack_id: input.pack_id,
          kind: input.kind,
          ref_id: input.ref_id,
          position: input.position ?? 0,
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    async updatePackItem(id: string, input: {
      ref_id?: string;
      position?: number;
      metadata?: Record<string, any> | null;
    }) {
      const { error } = await sb()
        .from('pack_items')
        .update({
          ...(input.ref_id !== undefined ? { ref_id: input.ref_id } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        })
        .eq('id', id);
      if (error) throw error;
    },

    async deletePackItem(id: string) {
      const { error } = await sb().from('pack_items').delete().eq('id', id);
      if (error) throw error;
    },

    async createPack(input: {
      file?: File;
      title: string;
      slug: string;
      is_free: boolean;
      title_i18n?: Record<string, string> | null;
      description_i18n?: Record<string, string> | null;
    }) {
      let cover_path: string | null = null;
      if (input.file) {
        const fileName = `${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await sb().storage
          .from('packs')
          .upload(fileName, input.file, { upsert: false });
        if (uploadError) throw uploadError;
        cover_path = fileName;
      }
      const { error } = await sb().from('packs').insert({
        title: input.title,
        slug: input.slug,
        cover_path,
        is_free: input.is_free,
        ...(input.title_i18n ? { title_i18n: input.title_i18n } : {}),
        ...(input.description_i18n ? { description_i18n: input.description_i18n } : {}),
      });
      if (error) throw error;
    },

    async updatePack(id: string, input: {
      file?: File;
      title: string;
      slug: string;
      is_free: boolean;
      title_i18n?: Record<string, string> | null;
      description_i18n?: Record<string, string> | null;
    }) {
      let cover_path: string | undefined;
      if (input.file) {
        const fileName = `${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await sb().storage
          .from('packs')
          .upload(fileName, input.file, { upsert: false });
        if (uploadError) throw uploadError;
        cover_path = fileName;
      }
      const { error } = await sb()
        .from('packs')
        .update({
          title: input.title,
          slug: input.slug,
          is_free: input.is_free,
          ...(cover_path ? { cover_path } : {}),
          ...(input.title_i18n !== undefined ? { title_i18n: input.title_i18n } : {}),
          ...(input.description_i18n !== undefined ? { description_i18n: input.description_i18n } : {}),
        })
        .eq('id', id);
      if (error) throw error;
    },

    async deletePack(id: string) {
      const { error } = await sb().from('packs').delete().eq('id', id);
      if (error) throw error;
    },

    async templates(opts: { freeOnly?: boolean; packId?: string; ids?: string[]; columns?: string } = {}): Promise<TemplateRow[]> {
      if (opts.ids && opts.ids.length === 0) return [];
      let q = sb()
        .from('templates')
        .select(opts.columns ?? '*')
        .order('created_at', { ascending: false });
      if (opts.freeOnly) q = q.eq('is_free', true);
      if (opts.packId) q = q.eq('pack_id', opts.packId);
      if (opts.ids?.length) q = q.in('id', opts.ids);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TemplateRow[];
    },

    async templateById(id: string): Promise<TemplateRow | null> {
      const { data, error } = await sb().from('templates').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return (data as TemplateRow | null) ?? null;
    },

    async categories(kind?: string, columns?: string) {
      let q = sb()
        .from('categories')
        .select(columns ?? 'id, slug, name, description, icon, image_path, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (kind) q = q.eq('kind', kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async contentDiscovery() {
      const { data, error } = await sb().from('content_discovery').select('*').order('position');
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async contentCategoriesFor(type: string) {
      const { data, error } = await (sb() as any)
        .from('content_categories')
        .select('content_id, category_id, categories(slug, name)')
        .eq('content_type', type);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async carouselsByIds(ids: string[]) {
      if (ids.length === 0) return [];
      const { data, error } = await sb().from('carousels').select('id, title').in('id', ids);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    packCoverUrl(path: string | null | undefined): string | null {
      if (!path) return null;
      return sb().storage.from('packs').getPublicUrl(path).data.publicUrl;
    },

    templateImageUrl(path: string | null | undefined): string | null {
      if (!path) return null;
      return sb().storage.from('templates').getPublicUrl(path).data.publicUrl;
    },

    storageUrl(bucket: string, path: string): string {
      return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },

    async createTemplate(input: { file: File; title: string; is_free: boolean }) {
      const fileName = `${Date.now()}-${input.file.name}`;
      const { error: uploadError } = await sb().storage
        .from('templates')
        .upload(fileName, input.file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error } = await sb().from('templates').insert({
        title: input.title,
        image_path: fileName,
        is_free: input.is_free,
      });
      if (error) throw error;
    },

    async saveTemplate(id: string, input: { file?: File; title: string; is_free: boolean; required_entitlement?: string | null }) {
      let image_path: string | undefined;
      if (input.file) {
        const fileName = `${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await sb().storage
          .from('templates')
          .upload(fileName, input.file, { upsert: false });
        if (uploadError) throw uploadError;
        image_path = fileName;
      }
      const { error } = await sb().from('templates').update({
        title: input.title,
        is_free: input.is_free,
        required_entitlement: input.required_entitlement ?? null,
        ...(image_path ? { image_path } : {}),
      }).eq('id', id);
      if (error) throw error;
    },

    async deleteTemplate(id: string) {
      const { error } = await sb().from('templates').delete().eq('id', id);
      if (error) throw error;
    },

    async updateTemplate(id: string, patch: Record<string, any>) {
      const { data, error } = await sb().from('templates').update(patch).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return data ?? null;
    },

    async templateCategories(contentId: string) {
      return repo.catalog.contentCategoriesForContent('template', contentId);
    },

    async contentCategoriesForContent(type: string, contentId: string) {
      const { data, error } = await (sb() as any)
        .from('content_categories')
        .select('category_id, categories(slug, name)')
        .eq('content_type', type)
        .eq('content_id', contentId);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async lessonsForParent(columns = 'id, title') {
      const { data, error } = await sb().from('lessons').select(columns);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async firstCatalogLesson() {
      const { data, error } = await sb()
        .from('lessons')
        .select('id')
        .eq('status', 'published')
        .eq('visibility', 'catalog')
        .order('published_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async rpc(name: string, params: Record<string, any>) {
      const { data, error } = await sb().rpc(name, params);
      if (error) throw error;
      return data;
    },
  },

  library: {
    async artworksForUser(): Promise<any[]> {
      const user = await requireUser(sb());
      const { data, error } = await sb()
        .from('artworks')
        .select('id, title, image_url, thumbnail_url, like_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async favorites(entityType?: string): Promise<Array<{ entity_type: string; entity_id: string }>> {
      const user = await requireUser(sb());
      let q = sb().from('user_favorites').select('entity_type, entity_id').eq('user_id', user.id);
      if (entityType) q = q.eq('entity_type', entityType);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Array<{ entity_type: string; entity_id: string }>;
    },

    async myRating(entityType: string, entityId: string): Promise<number | null> {
      const user = await requireUser(sb());
      const { data } = await sb()
        .from('user_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();
      return (data as any)?.rating ?? null;
    },

    async setRating(entityType: string, entityId: string, rating: number) {
      if (rating < 1 || rating > 5) throw new Error('Rating must be 1..5');
      const user = await requireUser(sb());
      const { data: existing } = await sb()
        .from('user_ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();
      if (existing) {
        const { error } = await sb()
          .from('user_ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await sb()
          .from('user_ratings')
          .insert({ user_id: user.id, entity_type: entityType, entity_id: entityId, rating });
        if (error) throw error;
      }
    },

    async toggleFavorite(entityType: string, entityId: string, desired: boolean) {
      const user = await requireUser(sb());
      if (desired) {
        const { error } = await sb()
          .from('user_favorites')
          .upsert({ user_id: user.id, entity_type: entityType, entity_id: entityId });
        if (error) throw error;
      } else {
        const { error } = await sb()
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('entity_type', entityType)
          .eq('entity_id', entityId);
        if (error) throw error;
      }
    },
  },

  learn: {
    async lessonsInPack(packId: string) {
      const { data, error } = await sb()
        .from('pack_items')
        .select('ref_id, position, lessons(*)')
        .eq('pack_id', packId)
        .eq('kind', 'lesson')
        .order('position');
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async lessonById(id: string) {
      const { data, error } = await sb().from('lessons').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },

    async lessonSteps(lessonId: string) {
      const { data, error } = await sb()
        .from('lesson_steps')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('step_index');
      if (error) throw error;
      return (data ?? []) as any[];
    },

    async progressFor(lessonId: string, childProfileId?: string | null) {
      const user = await requireUser(sb());
      let q = sb().from('user_lesson_progress').select('*').eq('lesson_id', lessonId);
      q = childProfileId ? q.eq('child_profile_id', childProfileId) : q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  },

  drawings: {
    async uploadFile(path: string, blob: Blob, upsert = false, contentType?: string) {
      const { error } = await sb()
        .storage.from('drawings')
        .upload(path, blob, { upsert, ...(contentType ? { contentType } : {}) });
      if (error) throw error;
    },

    async uploadJson(path: string, payload: unknown, upsert = false) {
      const { error } = await sb()
        .storage.from('drawings')
        .upload(path, new Blob([JSON.stringify(payload)], { type: 'application/json' }), { upsert });
      if (error) throw error;
    },

    async uploadPng(path: string, blob: Blob, upsert = false) {
      const { error } = await sb()
        .storage.from('drawings')
        .upload(path, blob, { upsert, contentType: 'image/png' });
      if (error) throw error;
    },

    async signedUrl(path: string, expiresIn = 60 * 60 * 24 * 7): Promise<string> {
      const { data, error } = await sb()
        .storage.from('drawings')
        .createSignedUrl(path, expiresIn);
      if (error || !data?.signedUrl) throw error ?? new Error('No URL');
      return data.signedUrl;
    },

    async downloadJson<T = any>(path: string): Promise<T | null> {
      const { data, error } = await sb().storage.from('drawings').download(path);
      if (error) return null;
      return JSON.parse(await data.text()) as T;
    },
  },

  /** Realtime subscription wrapper — views get an unsubscribe fn, not the client. */
  realtime: {
    subscribeTable(
      channelName: string,
      filter: { event?: string; schema?: string; table: string },
      onChange: () => void,
    ): () => void {
      const channel = sb()
        .channel(channelName)
        .on('postgres_changes', { event: filter.event ?? '*', schema: filter.schema ?? 'public', table: filter.table }, onChange)
        .subscribe();
      return () => { channel.unsubscribe(); };
    },
  },

  analytics: {
    async ingest(events: any[]) {
      const user = await requireUser(sb());
      const rows = events.map((e) => ({ ...e, user_id: e.user_id ?? user.id }));
      const { error } = await sb().from('analytics_events').insert(rows);
      if (error) throw error;
    },
  },
};
