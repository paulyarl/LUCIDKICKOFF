'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Artwork, ArtworkListParams, ActivityType, ApiResponse } from '../database.types';
import apiClient from './client';
import { useAuth } from '../auth/use-auth';
import { useI18n } from '../i18n/provider';

// S4.2 key policy: every query key is [actor, locale, version, ...rest].
// Actor = auth user (or 'anon'); version is bumped when server payload
// shapes change so stale cross-deploy cache entries never collide.
const CONTENT_VERSION = 'v1';

function useQueryKeys() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const scope = [user?.id ?? 'anon', locale, CONTENT_VERSION] as const;
  return {
    scope,
    artworks: [...scope, 'artworks'] as const,
    artwork: (id: string) => [...scope, 'artworks', id] as const,
    categories: [...scope, 'categories'] as const,
    favorites: (userId: string) => [...scope, 'favorites', userId] as const,
    activities: (userId: string) => [...scope, 'activities', userId] as const,
    trending: [...scope, 'trending'] as const,
    search: (query: string) => [...scope, 'search', query] as const,
  };
}

// Artwork queries
export function useArtworks(params: ArtworkListParams = {}) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: [...queryKeys.artworks, params],
    queryFn: () => apiClient.getArtworks(params),
    keepPreviousData: true,
  });
}

export function useInfiniteArtworks(params: Omit<ArtworkListParams, 'offset'> = {}) {
  const queryKeys = useQueryKeys();
  const { limit = 20, ...restParams } = params;
  
  return useInfiniteQuery({
    queryKey: [...queryKeys.artworks, 'infinite', restParams],
    queryFn: ({ pageParam = 0 }) => 
      apiClient.getArtworks({ ...restParams, offset: pageParam * limit, limit }),
    getNextPageParam: (lastPage: ApiResponse<Artwork[]>, allPages: ApiResponse<Artwork[]>[]) => {
      if (!lastPage.data || lastPage.data.length < limit) return undefined;
      return allPages.length;
    },
    keepPreviousData: true,
  });
}

export function useArtwork(id: string) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: queryKeys.artwork(id),
    queryFn: () => apiClient.getArtwork(id),
    enabled: !!id,
  });
}

// Artwork mutations
export function useCreateArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createArtwork>[0]) => 
      apiClient.createArtwork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artworks });
    },
  });
}

export function useUpdateArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof apiClient.updateArtwork>[1] }) => 
      apiClient.updateArtwork(id, updates),
    onSuccess: (_data: ApiResponse<Artwork>, { id }: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artworks });
      queryClient.invalidateQueries({ queryKey: queryKeys.artwork(id) });
    },
  });
}

export function useDeleteArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteArtwork(id),
    onSuccess: (_: ApiResponse<null>, id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artworks });
      queryClient.removeQueries({ queryKey: queryKeys.artwork(id) });
    },
  });
}

// Like and favorite mutations
export function useLikeArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (artworkId: string) => apiClient.likeArtwork(artworkId),
    onMutate: async (artworkId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.artworks });
      await queryClient.cancelQueries({ queryKey: queryKeys.artwork(artworkId) });
      
      // Snapshot the previous value
      const previousArtwork = queryClient.getQueryData<Artwork>(queryKeys.artwork(artworkId));
      
      // Optimistically update the artwork
      if (previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), {
          ...previousArtwork,
          is_liked: true,
          like_count: (previousArtwork.like_count || 0) + 1,
        });
      }
      
      return { previousArtwork } as { previousArtwork?: Artwork };
    },
    onError: (
      _error: unknown,
      artworkId: string,
      context?: { previousArtwork?: Artwork }
    ) => {
      // Rollback on error
      if (context?.previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), context.previousArtwork);
      }
    },
    onSettled: (_: unknown, __: unknown, artworkId: string) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.artworks });
      queryClient.invalidateQueries({ queryKey: queryKeys.artwork(artworkId) });
    },
  });
}

export function useUnlikeArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (artworkId: string) => apiClient.unlikeArtwork(artworkId),
    onMutate: async (artworkId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.artworks });
      await queryClient.cancelQueries({ queryKey: queryKeys.artwork(artworkId) });
      
      const previousArtwork = queryClient.getQueryData<Artwork>(queryKeys.artwork(artworkId));
      
      if (previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), {
          ...previousArtwork,
          is_liked: false,
          like_count: Math.max(0, (previousArtwork.like_count || 1) - 1),
        });
      }
      
      return { previousArtwork };
    },
    onError: (_: unknown, artworkId: string, context?: { previousArtwork?: Artwork }) => {
      if (context?.previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), context.previousArtwork);
      }
    },
    onSettled: (_: unknown, __: unknown, artworkId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artworks });
      queryClient.invalidateQueries({ queryKey: queryKeys.artwork(artworkId) });
    },
  });
}

export function useFavoriteArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (artworkId: string) => apiClient.favoriteArtwork(artworkId),
    onMutate: async (artworkId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.artwork(artworkId) });
      
      const previousArtwork = queryClient.getQueryData<Artwork>(queryKeys.artwork(artworkId));
      
      if (previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), {
          ...previousArtwork,
          is_favorite: true,
        });
      }
      
      return { previousArtwork };
    },
    onError: (_: unknown, artworkId: string, context?: { previousArtwork?: Artwork }) => {
      if (context?.previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), context.previousArtwork);
      }
    },
    onSettled: (_: unknown, __: unknown, artworkId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artwork(artworkId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites('current') });
    },
  });
}

export function useUnfavoriteArtwork() {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (artworkId: string) => apiClient.unfavoriteArtwork(artworkId),
    onMutate: async (artworkId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.artwork(artworkId) });
      
      const previousArtwork = queryClient.getQueryData<Artwork>(queryKeys.artwork(artworkId));
      
      if (previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), {
          ...previousArtwork,
          is_favorite: false,
        });
      }
      
      return { previousArtwork };
    },
    onError: (_: unknown, artworkId: string, context?: { previousArtwork?: Artwork }) => {
      if (context?.previousArtwork) {
        queryClient.setQueryData(queryKeys.artwork(artworkId), context.previousArtwork);
      }
    },
    onSettled: (_: unknown, __: unknown, artworkId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.artwork(artworkId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites('current') });
    },
  });
}

// Activity tracking
export function useTrackActivity() {
  return useMutation({
    mutationFn: ({ artworkId, type }: { artworkId: string; type: ActivityType }) => 
      apiClient.trackActivity(artworkId, type),
  });
}

// Favorites
export function useFavorites(userId: string) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: queryKeys.favorites(userId),
    queryFn: () => apiClient.getFavorites(userId),
    enabled: !!userId,
  });
}

// Activities
export function useRecentActivities(userId: string) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: queryKeys.activities(userId),
    queryFn: () => apiClient.getRecentActivities(userId),
    enabled: !!userId,
  });
}

// Trending
export function useTrendingArtworks(limit: number = 10) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: [...queryKeys.trending, limit],
    queryFn: () => apiClient.getTrendingArtworks(limit),
  });
}

// Search
export function useSearchArtworks(query: string) {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => apiClient.getArtworks({ search: query }),
    enabled: query.length > 2,
  });
}

// Real-time subscriptions
export function useArtworkSubscription(artworkId: string, enabled = true) {
  const queryKeys = useQueryKeys();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!enabled) return;
    
    const channel = apiClient.getSupabase()
      .channel(`artwork:${artworkId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artworks',
          filter: `id=eq.${artworkId}`,
        },
        (payload: any) => {
          queryClient.setQueryData(queryKeys.artwork(artworkId), (old: any) => ({
            ...old,
            ...payload.new,
          }));
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [artworkId, enabled, queryClient]);
}

// Categories
export function useCategories() {
  const queryKeys = useQueryKeys();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiClient.getSupabase()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) throw error;
        return { data, error: null };
      }),
  });
}
