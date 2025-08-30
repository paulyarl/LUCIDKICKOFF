'use client';

import React, { useState, useEffect } from 'react';
import { PackGrid, Pack } from './PackGrid';
import { useAuth } from '@/lib/auth/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/provider';
import { toggleFavorite } from '@/lib/engagement';

// Mock data for development
const mockPacks: Pack[] = [
  {
    id: '1',
    title: 'Basic Shapes & Forms',
    description: 'Learn fundamental drawing techniques with simple geometric shapes and basic forms.',
    imageUrl: '/images/packs/basic-shapes.svg',
    progress: 45,
    isLocked: false,
    isNew: true,
    isTrending: false,
    isFavorite: false,
    category: 'fundamentals',
    difficulty: 'beginner',
    tags: ['shapes', 'basics', 'fundamentals'],
  },
  {
    id: '2',
    title: 'Animal Kingdom',
    description: 'Discover how to draw various animals with step-by-step guidance and coloring pages.',
    imageUrl: '/images/packs/animals.svg',
    progress: 0,
    isLocked: false,
    isNew: false,
    isTrending: true,
    isFavorite: true,
    category: 'nature',
    difficulty: 'intermediate',
    tags: ['animals', 'nature', 'wildlife'],
  },
  {
    id: '3',
    title: 'Fantasy Creatures',
    description: 'Bring mythical beings to life with detailed drawing tutorials and magical coloring pages.',
    imageUrl: '/images/packs/fantasy.svg',
    progress: 100,
    isLocked: false,
    isNew: false,
    isTrending: false,
    isFavorite: false,
    category: 'fantasy',
    difficulty: 'advanced',
    tags: ['fantasy', 'creatures', 'mythology'],
  },
  {
    id: '4',
    title: 'Botanical Illustrations',
    description: 'Master the art of drawing plants, flowers, and botanical elements with scientific accuracy.',
    imageUrl: '/images/packs/botanical.svg',
    progress: 0,
    isLocked: true,
    isNew: false,
    isTrending: false,
    isFavorite: false,
    category: 'nature',
    difficulty: 'intermediate',
    tags: ['plants', 'flowers', 'botanical'],
  },
  {
    id: '5',
    title: 'Portrait Fundamentals',
    description: 'Learn the basics of portrait drawing including proportions, features, and shading techniques.',
    imageUrl: '/images/packs/portraits.svg',
    progress: 25,
    isLocked: false,
    isNew: false,
    isTrending: true,
    isFavorite: true,
    category: 'people',
    difficulty: 'advanced',
    tags: ['portraits', 'faces', 'people'],
  },
  {
    id: '6',
    title: 'Landscape Basics',
    description: 'Create beautiful landscapes with techniques for drawing mountains, trees, and natural scenery.',
    imageUrl: '/images/packs/landscapes.svg',
    progress: 0,
    isLocked: true,
    isNew: false,
    isTrending: false,
    isFavorite: false,
    category: 'nature',
    difficulty: 'intermediate',
    tags: ['landscapes', 'nature', 'scenery'],
  },
];

export function PackManager() {
  const [packs, setPacks] = useState<Pack[]>(mockPacks);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  const { t } = useI18n();

  // Load user's pack progress and favorites
  useEffect(() => {
    if (user) {
      loadUserPackData();
    }
  }, [user]);

  const loadUserPackData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // In a real app, you would fetch user's pack progress and favorites from Supabase
      // For now, we'll use the mock data
      
      // Example query structure:
      // const { data: userPacks } = await supabase
      //   .from('user_packs')
      //   .select('pack_id, progress, is_favorite')
      //   .eq('user_id', user.id);
      
      // const { data: unlockedPacks } = await supabase
      //   .from('user_unlocked_packs')
      //   .select('pack_id')
      //   .eq('user_id', user.id);

      // For now, just use mock data
      console.log('User pack data loaded');
    } catch (error) {
      console.error('Error loading user pack data:', error);
      toast.error(t('packs.toast.loadError') || 'Failed to load your pack progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackStudy = async (packId: string) => {
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    if (pack.isLocked) {
      toast.error(t('packs.toast.locked') || 'This pack is locked. Complete previous packs to unlock it.');
      return;
    }

    // Navigate to study mode
    window.location.href = `/packs/${packId}/study`;
  };

  const handlePackStudyAndColor = async (packId: string) => {
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    if (pack.isLocked) {
      toast.error(t('packs.toast.locked') || 'This pack is locked. Complete previous packs to unlock it.');
      return;
    }

    // Navigate to study and color mode
    window.location.href = `/packs/${packId}/study-and-color`;
  };

  const handlePackFavoriteToggle = async (packId: string) => {
    if (!user) {
      toast.error(t('packs.toast.signInFavorites') || 'Please sign in to add favorites');
      return;
    }

    try {
      // optimistic toggle
      const prev = packs;
      const next = packs.map(p => p.id === packId ? { ...p, isFavorite: !p.isFavorite } : p);
      setPacks(next);

      const desired = next.find(p => p.id === packId)?.isFavorite ?? false;
      await toggleFavorite('pack', packId, desired);

      toast.success(
        desired
          ? (t('packs.toast.addedFavorite') || 'Added to favorites')
          : (t('packs.toast.removedFavorite') || 'Removed from favorites')
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('packs.toast.updateFavoritesError') || 'Failed to update favorites');
      
      // Revert
      setPacks(packs.map(p => p.id === packId ? { ...p, isFavorite: !p.isFavorite } : p));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PackGrid
      packs={packs}
      onPackStudy={handlePackStudy}
      onPackStudyAndColor={handlePackStudyAndColor}
      onPackFavoriteToggle={handlePackFavoriteToggle}
    />
  );
}
