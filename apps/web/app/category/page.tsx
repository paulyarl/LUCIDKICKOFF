'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { ArtworkCard } from '@/components/artwork/ArtworkCard';
import { CategoryChips } from '@/components/category/CategoryChips';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/use-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

// Mock data - replace with real data from your API
const MOCK_ARTWORKS = [
  {
    id: '1',
    title: 'Ocean Life',
    imageUrl: '/packs/ocean-life/thumbnail.jpg',
    creator: {
      id: 'user1',
      name: 'Marine Explorer',
      avatarUrl: '/avatars/user1.jpg',
    },
    likes: 1243,
    isLiked: false,
    isFavorite: false,
    lastVisited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    visitCount: 5,
  },
  // Add more mock data as needed
];

const CATEGORIES = [
  { id: 'all', label: 'All Packs', count: 42 },
  { id: 'trending', label: 'Trending', count: 12 },
  { id: 'new', label: 'New', count: 8 },
  { id: 'popular', label: 'Popular', count: 23 },
  { id: 'favorites', label: 'Favorites', count: 5 },
  { id: 'recent', label: 'Recently Visited', count: 7 },
  { id: 'animals', label: 'Animals', count: 15 },
  { id: 'nature', label: 'Nature', count: 18 },
  { id: 'space', label: 'Space', count: 9 },
  { id: 'fantasy', label: 'Fantasy', count: 11 },
];

export default function CategoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [visitedArtworks, setVisitedArtworks] = useState<Record<string, { lastVisited: Date; count: number }>>({});
  
  // Get category from URL or default to 'all'
  const category = searchParams.get('category') || 'all';
  
  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // In a real app, you would fetch this data from your database
        // For now, we'll use mock data
        
        // Load favorites
        let userFavorites = new Set<string>();
        if (user) {
          // Fetch user favorites from database
          // const { data } = await supabase.from('favorites').select('artwork_id').eq('user_id', user.id);
          // userFavorites = new Set(data?.map((item: any) => item.artwork_id) || []);
        } else {
          // Load from localStorage for guests
          const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
          userFavorites = new Set(localFavorites);
        }
        setFavorites(userFavorites);
        
        // Load visited artworks (last 30 days)
        const visited: Record<string, { lastVisited: Date; count: number }> = {};
        // In a real app, fetch from database for logged-in users
        // For now, we'll use mock data
        MOCK_ARTWORKS.forEach(artwork => {
          if (artwork.lastVisited) {
            visited[artwork.id] = {
              lastVisited: artwork.lastVisited,
              count: artwork.visitCount || 1,
            };
          }
        });
        setVisitedArtworks(visited);
        
        // Filter and set artworks based on category
        filterArtworks(category, searchQuery, userFavorites, visited);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [category, searchQuery, user]);
  
  // Filter artworks based on category and search query
  const filterArtworks = useCallback((
    currentCategory: string,
    query: string,
    userFavorites: Set<string>,
    visited: Record<string, { lastVisited: Date; count: number }>
  ) => {
    let filtered = [...MOCK_ARTWORKS];
    
    // Apply category filter
    switch (currentCategory) {
      case 'favorites':
        filtered = filtered.filter(artwork => userFavorites.has(artwork.id));
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(artwork => 
          artwork.lastVisited && new Date(artwork.lastVisited) >= thirtyDaysAgo
        ).sort((a, b) => 
          new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
        );
        break;
      case 'trending':
        filtered.sort((a, b) => b.likes - a.likes);
        filtered = filtered.slice(0, 12); // Top 12 trending
        break;
      case 'new':
        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        filtered = filtered.slice(0, 12); // 12 newest
        break;
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      // Add more category filters as needed
    }
    
    // Apply search query
    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(artwork => 
        artwork.title.toLowerCase().includes(queryLower) ||
        (artwork.creator?.name?.toLowerCase().includes(queryLower) || false)
      );
    }
    
    // Update favorites and visited status
    filtered = filtered.map(artwork => ({
      ...artwork,
      isFavorite: userFavorites.has(artwork.id),
      lastVisited: visited[artwork.id]?.lastVisited,
      visitCount: visited[artwork.id]?.count || 0,
    }));
    
    setArtworks(filtered);
  }, []);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterArtworks(category, searchQuery, favorites, visitedArtworks);
  };
  
  // Handle like action
  const handleLike = async (artworkId: string) => {
    try {
      // In a real app, you would update the like in your database here
      // For now, we'll just update the local state
      setArtworks(prev => prev.map(artwork => 
        artwork.id === artworkId 
          ? { 
              ...artwork, 
              likes: artwork.isLiked ? artwork.likes - 1 : artwork.likes + 1,
              isLiked: !artwork.isLiked 
            } 
          : artwork
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  // Handle favorite action
  const handleFavorite = async (artworkId: string, isFavorite: boolean) => {
    try {
      const newFavorites = new Set(favorites);
      
      if (isFavorite) {
        newFavorites.add(artworkId);
      } else {
        newFavorites.delete(artworkId);
      }
      
      setFavorites(newFavorites);
      
      // Update the artwork's favorite status
      setArtworks(prev => prev.map(artwork => 
        artwork.id === artworkId 
          ? { ...artwork, isFavorite } 
          : artwork
      ));
      
      if (user) {
        // In a real app, update favorite in database
        // if (isFavorite) {
        //   await supabase.from('favorites').insert([{ user_id: user.id, artwork_id: artworkId }]);
        // } else {
        //   await supabase.from('favorites')
        //     .delete()
        //     .eq('user_id', user.id)
        //     .eq('artwork_id', artworkId);
        // }
      } else {
        // For guests, update localStorage
        localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  // Handle study action
  const handleStudy = (artworkId: string) => {
    // Track the visit
    const now = new Date();
    const updatedVisited = {
      ...visitedArtworks,
      [artworkId]: {
        lastVisited: now,
        count: (visitedArtworks[artworkId]?.count || 0) + 1,
      },
    };
    setVisitedArtworks(updatedVisited);
    
    // In a real app, you would save this to your database
    // For now, we'll just update the local state
    setArtworks(prev => prev.map(artwork => 
      artwork.id === artworkId 
        ? { 
            ...artwork, 
            lastVisited: now,
            visitCount: (artwork.visitCount || 0) + 1,
          } 
        : artwork
    ));
    
    // Navigate to study page
    router.push(`/artwork/${artworkId}/study`);
  };
  
  // Handle color action
  const handleColor = (artworkId: string) => {
    // Track the visit (same as study)
    const now = new Date();
    const updatedVisited = {
      ...visitedArtworks,
      [artworkId]: {
        lastVisited: now,
        count: (visitedArtworks[artworkId]?.count || 0) + 1,
      },
    };
    setVisitedArtworks(updatedVisited);
    
    // Update local state
    setArtworks(prev => prev.map(artwork => 
      artwork.id === artworkId 
        ? { 
            ...artwork, 
            lastVisited: now,
            visitCount: (artwork.visitCount || 0) + 1,
          } 
        : artwork
    ));
    
    // Navigate to color page
    router.push(`/artwork/${artworkId}/color`);
  };
  
  // Format last visited text
  const formatLastVisited = (date: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Discover Packs</h1>
        <p className="text-muted-foreground">
          Explore our collection of coloring packs and start your creative journey
        </p>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search packs, creators, or categories..."
            className="pl-10 pr-4 py-6 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2"
            size="sm"
          >
            Search
          </Button>
        </div>
      </form>
      
      {/* Category Chips */}
      <div className="mb-8">
        <CategoryChips 
          categories={CATEGORIES} 
          defaultCategory={category}
          showCounts={true}
          scrollable={true}
        />
      </div>
      
      {/* Main Content */}
      <div className="space-y-12">
        {/* Category Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {category === 'all' ? 'All Packs' : 
               category === 'favorites' ? 'Your Favorites' :
               category === 'recent' ? 'Recently Visited' :
               `${category.charAt(0).toUpperCase() + category.slice(1)} Packs`}
            </h2>
            <div className="flex items-center gap-2
            ">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Icons.filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Icons.sortAsc className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  id={artwork.id}
                  title={artwork.title}
                  imageUrl={artwork.imageUrl}
                  creator={artwork.creator}
                  likes={artwork.likes}
                  isLiked={artwork.isLiked}
                  isFavorite={artwork.isFavorite}
                  lastVisited={artwork.lastVisited}
                  onLike={() => handleLike(artwork.id)}
                  onFavorite={handleFavorite}
                  onStudy={() => handleStudy(artwork.id)}
                  onColor={() => handleColor(artwork.id)}
                  showCreator={true}
                  showLikes={true}
                  showLastVisited={category === 'recent'}
                  showFavorite={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <Icons.packageSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No packs found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'There are no packs in this category yet. Check back later!'}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    filterArtworks(category, '', favorites, visitedArtworks);
                  }}
                >
                  <Icons.x className="mr-2 h-4 w-4" />
                  Clear search
                </Button>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {artworks.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Icons.chevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <span className="px-2">...</span>
                <Button variant="outline" size="sm">10</Button>
                <Button variant="outline" size="sm">
                  Next
                  <Icons.chevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
        
        {/* Community Feed (gated by feature flag) */}
        <CommunityFeed 
          artworks={artworks}
          isLoading={isLoading}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onStudy={handleStudy}
          onColor={handleColor}
        />
      </div>
    </div>
  );
}
