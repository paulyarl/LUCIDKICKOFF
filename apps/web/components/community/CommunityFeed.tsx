'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { ArtworkCard } from '@/components/artwork/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag';

type FeedType = 'popular' | 'new' | 'trending' | 'for-you' | 'challenges';

interface CommunityFeedProps {
  artworks: Array<{
    id: string;
    title: string;
    imageUrl: string;
    creator: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    likes: number;
    isLiked?: boolean;
    isFavorite?: boolean;
    createdAt: string;
  }>;
  isLoading?: boolean;
  onLike?: (id: string) => void;
  onFavorite?: (id: string, isFavorite: boolean) => void;
  onStudy?: (id: string) => void;
  onColor?: (id: string) => void;
  className?: string;
}

export function CommunityFeed({
  artworks = [],
  isLoading = false,
  onLike,
  onFavorite,
  onStudy,
  onColor,
  className,
}: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedType>('popular');
  const isCommunityEnabled = useFeatureFlag('community_feed');
  
  // Filter and sort artworks based on active tab
  const filteredArtworks = useMemo(() => {
    if (isLoading) return [];
    
    const sorted = [...artworks];
    
    switch (activeTab) {
      case 'new':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'trending':
        // In a real app, this would use a more sophisticated algorithm
        return sorted.sort((a, b) => b.likes - a.likes);
      case 'challenges':
        // Filter for challenge entries
        return sorted.filter(artwork => artwork.title.toLowerCase().includes('challenge'));
      case 'for-you':
        // In a real app, this would use user preferences and history
        return sorted.sort(() => Math.random() - 0.5).slice(0, 12);
      case 'popular':
      default:
        return sorted.sort((a, b) => b.likes - a.likes);
    }
  }, [activeTab, artworks, isLoading]);
  
  // Show nothing if community feature is disabled
  if (!isCommunityEnabled) {
    return null;
  }
  
  // Skeleton loader
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Community Feed</h2>
        </div>
        
        <Tabs defaultValue="popular" className="w-full">
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="popular" className="px-4">Popular</TabsTrigger>
              <TabsTrigger value="new" className="px-4">New</TabsTrigger>
              <TabsTrigger value="trending" className="px-4">Trending</TabsTrigger>
              <TabsTrigger value="for-you" className="px-4">For You</TabsTrigger>
              <TabsTrigger value="challenges" className="px-4">Challenges</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </Tabs>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Community Feed</h2>
        <Button variant="outline" size="sm">
          <Icons.plus className="mr-2 h-4 w-4" />
          Share Your Art
        </Button>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as FeedType)}
        className="w-full"
      >
        <div className="overflow-x-auto pb-2 -mb-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="popular" className="px-4">
              <Icons.flame className="mr-2 h-4 w-4" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="new" className="px-4">
              <Icons.sparkles className="mr-2 h-4 w-4" />
              New
            </TabsTrigger>
            <TabsTrigger value="trending" className="px-4">
              <Icons.trendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="for-you" className="px-4">
              <Icons.user className="mr-2 h-4 w-4" />
              For You
            </TabsTrigger>
            <TabsTrigger value="challenges" className="px-4">
              <Icons.trophy className="mr-2 h-4 w-4" />
              Challenges
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredArtworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  {...artwork}
                  onLike={onLike}
                  onFavorite={onFavorite}
                  onStudy={onStudy}
                  onColor={onColor}
                  showCreator
                  showLikes
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
              <Icons.imageOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No artworks found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                There are no artworks in this category yet. Be the first to share your creation!
              </p>
              <Button className="mt-4">
                <Icons.plus className="mr-2 h-4 w-4" />
                Share Your Art
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
