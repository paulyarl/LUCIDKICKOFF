'use client';

import { createClient } from '@/lib/supabase/client';
import { Artwork, ArtworkListParams, ApiResponse, ActivityType, ArtworkWithDetails } from '../database.types';

export class ApiClient {
  private supabase = createClient();

  // Expose a read-only Supabase client for hooks that need subscriptions or direct queries
  public getSupabase() {
    return this.supabase;
  }

  // Helper method to handle API responses
  private async handleResponse<T>(promise: Promise<{ data: T | null; error: any }>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await promise;
      
      if (error) {
        console.error('API Error:', error);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }

  // Artwork methods
  async getArtworks(params: ArtworkListParams = {}): Promise<ApiResponse<Artwork[]>> {
    const { category, search, sort = 'newest', limit = 20, offset = 0, userId } = params;
    
    let query = this.supabase
      .from('artworks')
      .select(`
        *,
        creator:profiles!artworks_user_id_fkey (username, avatar_url),
        categories:artwork_categories (category:categories (id, name, slug))
      `, { count: 'exact' })
      .eq('is_public', true)
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (category) {
      query = query.contains('categories', [{ category: { slug: category } }]);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'trending':
        // In a real app, you might want to use a more sophisticated algorithm
        query = query.order('like_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Transform the data to match our Artwork type
    const artworks = (data || []).map((artwork: any) => ({
      ...artwork,
      categories: (artwork.categories as any[]).map((cat: any) => ({
        id: cat.category.id,
        name: cat.category.name,
        slug: cat.category.slug,
      })),
      creator: artwork.creator || { username: 'Unknown', avatar_url: null },
    }));
    
    return { 
      data: artworks, 
      error: null,
      count: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  }
  
  async getArtwork(id: string): Promise<ApiResponse<ArtworkWithDetails>> {
    const { data, error } = await this.supabase
      .from('artworks')
      .select(`
        *,
        creator:profiles!artworks_user_id_fkey (username, avatar_url),
        categories:artwork_categories (category:categories (id, name, slug)),
        is_liked:likes!inner(artwork_id),
        is_favorite:favorites!inner(artwork_id)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Transform the data
    const artwork: any = {
      ...data,
      categories: (data.categories as any[]).map((cat: any) => ({
        id: cat.category.id,
        name: cat.category.name,
        slug: cat.category.slug,
      })),
      creator: data.creator || { username: 'Unknown', avatar_url: null },
      is_liked: Array.isArray(data.is_liked) ? data.is_liked.length > 0 : false,
      is_favorite: Array.isArray(data.is_favorite) ? data.is_favorite.length > 0 : false,
    };
    
    return { data: artwork, error: null };
  }
  
  async createArtwork(artwork: Omit<Artwork, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Artwork>> {
    // In a real app, you would handle file uploads here
    // For now, we'll assume the image_url is already uploaded
    const { data, error } = await this.supabase
      .from('artworks')
      .insert(artwork)
      .select()
      .single();
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  }
  
  async updateArtwork(
    id: string, 
    updates: Partial<Omit<Artwork, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ApiResponse<Artwork>> {
    const { data, error } = await this.supabase
      .from('artworks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  }
  
  async deleteArtwork(id: string): Promise<ApiResponse<null>> {
    const { error } = await this.supabase
      .from('artworks')
      .delete()
      .eq('id', id);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  }
  
  // Like/Unlike artwork
  async likeArtwork(artworkId: string): Promise<ApiResponse<null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }
    
    const { error } = await this.supabase
      .from('likes')
      .insert([{ user_id: user.id, artwork_id: artworkId }]);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  }
  
  async unlikeArtwork(artworkId: string): Promise<ApiResponse<null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }
    
    const { error } = await this.supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  }
  
  // Favorite/Unfavorite artwork
  async favoriteArtwork(artworkId: string): Promise<ApiResponse<null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }
    
    const { error } = await this.supabase
      .from('favorites')
      .insert([{ user_id: user.id, artwork_id: artworkId }]);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  }
  
  async unfavoriteArtwork(artworkId: string): Promise<ApiResponse<null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }
    
    const { error } = await this.supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  }
  
  // Track user activity
  async trackActivity(artworkId: string, type: ActivityType): Promise<ApiResponse<null>> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }
    
    const { error } = await this.supabase
      .from('user_activities')
      .insert([{ 
        user_id: user.id, 
        artwork_id: artworkId, 
        activity_type: type 
      }]);
      
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Update view count if this is a view event
    if (type === 'view') {
      await this.supabase.rpc('increment_artwork_views', { artwork_id: artworkId });
    }
    
    return { data: null, error: null };
  }
  
  // Get user's favorites
  async getFavorites(userId: string): Promise<ApiResponse<Artwork[]>> {
    const { data, error } = await this.supabase
      .from('favorites')
      .select(`
        artwork:artworks (
          *,
          creator:profiles!artworks_user_id_fkey (username, avatar_url),
          categories:artwork_categories (category:categories (id, name, slug))
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Transform the data
    const favorites = (data || [])
      .filter((item: any) => item.artwork) // Filter out any null artworks
      .map((item: any) => ({
        ...item.artwork,
        categories: (item.artwork.categories as any[]).map((cat: any) => ({
          id: cat.category.id,
          name: cat.category.name,
          slug: cat.category.slug,
        })),
        creator: item.artwork.creator || { username: 'Unknown', avatar_url: null },
        is_favorite: true,
      }));
    
    return { data: favorites, error: null };
  }
  
  // Get user's recent activities
  async getRecentActivities(userId: string): Promise<ApiResponse<any[]>> {
    const { data, error } = await this.supabase
      .from('user_activities')
      .select(`
        *,
        artwork:artworks (
          *,
          creator:profiles!artworks_user_id_fkey (username, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Transform the data
    const activities = (data || []).map((activity: any) => ({
      ...activity,
      artwork: {
        ...activity.artwork,
        creator: activity.artwork?.creator || { username: 'Unknown', avatar_url: null },
      },
    }));
    
    return { data: activities, error: null };
  }
  
  // Get trending artworks
  async getTrendingArtworks(limit: number = 10): Promise<ApiResponse<Artwork[]>> {
    const { data, error } = await this.supabase
      .from('trending_artworks')
      .select('*')
      .limit(limit);
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    // Transform the data to match our Artwork type
    const artworks = (data || []).map((artwork: any) => ({
      ...artwork,
      creator: {
        username: artwork.username || 'Unknown',
        avatar_url: artwork.user_avatar_url,
      },
      categories: [], // This view doesn't include categories
    }));
    
    return { data: artworks, error: null };
  }
}

// Create a singleton instance of the API client
const apiClient = new ApiClient();

export default apiClient;
