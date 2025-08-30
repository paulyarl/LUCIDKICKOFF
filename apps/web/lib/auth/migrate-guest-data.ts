import { createClient } from '@/lib/supabase/server';

type MigrationResult = {
  success: boolean;
  migrated: {
    artworks: number;
    favorites: number;
    userPacks: number;
  };
  error?: string;
};

export async function migrateGuestData(
  guestId: string,
  newUserId: string
): Promise<MigrationResult> {
  const supabase = createClient();
  
  try {
    // Start a transaction
    const { data, error } = await supabase.rpc('migrate_guest_data', {
      guest_id: guestId,
      new_user_id: newUserId,
    });

    if (error) throw error;
    
    return {
      success: true,
      migrated: {
        artworks: data?.artworks_updated || 0,
        favorites: data?.favorites_updated || 0,
        userPacks: data?.user_packs_updated || 0,
      },
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      migrated: { artworks: 0, favorites: 0, userPacks: 0 },
      error: error instanceof Error ? error.message : 'Failed to migrate guest data',
    };
  }
}

// Create a database function to handle the migration
export async function createMigrationFunction() {
  const sql = `
  create or replace function migrate_guest_data(guest_id uuid, new_user_id uuid)
  returns json
  language plpgsql
  security definer
  as $$
  declare
    artworks_updated integer;
    favorites_updated integer;
    user_packs_updated integer;
  begin
    -- Update artworks
    update public.artworks
    set user_id = new_user_id
    where user_id = guest_id
    returning 1 into artworks_updated;
    
    -- Update favorites
    update public.favorites
    set user_id = new_user_id
    where user_id = guest_id
    returning 1 into favorites_updated;
    
    -- Update user_packs
    update public.user_packs
    set user_id = new_user_id
    where user_id = guest_id
    returning 1 into user_packs_updated;
    
    -- Delete the guest profile
    delete from auth.users where id = guest_id;
    
    -- Return the counts
    return json_build_object(
      'artworks_updated', coalesce(artworks_updated, 0),
      'favorites_updated', coalesce(favorites_updated, 0),
      'user_packs_updated', coalesce(user_packs_updated, 0)
    );
  end;
  $$;
  `;

  const supabase = createClient();
  await supabase.rpc('execute_sql', { query: sql });
}
