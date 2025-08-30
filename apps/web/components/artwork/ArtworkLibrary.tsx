'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

type ArtworkStatus = 'in_progress' | 'completed';

type Artwork = {
  id: string;
  title: string;
  thumbnailUrl: string;
  status: ArtworkStatus;
  lastEdited: string;
  progress: number;
  packId?: string;
  packTitle?: string;
};

interface ArtworkLibraryProps {
  initialArtworks?: Artwork[];
  onArtworkSelect?: (artworkId: string) => void;
  onArtworkDelete?: (artworkId: string) => Promise<boolean>;
  onArtworkShare?: (artworkId: string) => void;
  className?: string;
}

export function ArtworkLibrary({
  initialArtworks = [],
  onArtworkSelect,
  onArtworkDelete,
  onArtworkShare,
  className,
}: ArtworkLibraryProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [deletedArtworks, setDeletedArtworks] = useState<{id: string, artwork: Artwork, timestamp: number}[]>([]);
  const [activeTab, setActiveTab] = useState<ArtworkStatus | 'all'>('all');
  const router = useRouter();

  // Group artworks by status
  const inProgressArtworks = artworks.filter(a => a.status === 'in_progress');
  const completedArtworks = artworks.filter(a => a.status === 'completed');

  // Check for recently deleted artworks that can be restored
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const expiredDeletions = deletedArtworks.filter(
        item => now - item.timestamp > 10000 // 10 seconds
      );
      
      if (expiredDeletions.length > 0) {
        // Remove expired deletions from the list
        setDeletedArtworks(prev => 
          prev.filter(item => now - item.timestamp <= 10000)
        );
        
        // Permanently remove the artworks that weren't restored
        const expiredIds = expiredDeletions.map(item => item.artwork.id);
        setArtworks(prev => prev.filter(a => !expiredIds.includes(a.id)));
        
        // Notify parent component about permanent deletion
        if (onArtworkDelete) {
          expiredDeletions.forEach(item => onArtworkDelete(item.artwork.id));
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [deletedArtworks, onArtworkDelete]);

  // Handle artwork deletion with undo functionality
  const handleDeleteArtwork = (artwork: Artwork) => {
    // Remove from active list
    setArtworks(prev => prev.filter(a => a.id !== artwork.id));
    
    // Add to deleted items with timestamp
    setDeletedArtworks(prev => [
      ...prev, 
      { id: artwork.id, artwork, timestamp: Date.now() }
    ]);
    
    // Show undo toast
    toast({
      title: 'Artwork moved to trash',
      description: (
        <div className="flex justify-between items-center">
          <span>You can undo this action within 10 seconds</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRestoreArtwork(artwork.id)}
            className="ml-4"
          >
            Undo
          </Button>
        </div>
      ),
    });
  };

  // Restore a deleted artwork
  const handleRestoreArtwork = (artworkId: string) => {
    const deletedItem = deletedArtworks.find(item => item.id === artworkId);
    if (deletedItem) {
      setArtworks(prev => [...prev, deletedItem.artwork]);
      setDeletedArtworks(prev => prev.filter(item => item.id !== artworkId));
      
      toast({
        title: 'Artwork restored',
        description: 'Your artwork has been restored.',
      });
    }
  };

  // Handle share action
  const handleShare = (artworkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArtworkShare) {
      onArtworkShare(artworkId);
    } else {
      // Default share behavior
      navigator.clipboard.writeText(`${window.location.origin}/artwork/${artworkId}`);
      toast({
        title: 'Link copied to clipboard',
        description: 'Share this link with others!',
      });
    }
  };

  // Handle edit action
  const handleEdit = (artworkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArtworkSelect) {
      onArtworkSelect(artworkId);
    } else {
      router.push(`/artwork/${artworkId}/edit`);
    }
  };

  // Render artwork card
  const renderArtworkCard = (artwork: Artwork) => (
    <Card 
      key={artwork.id}
      className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 h-full flex flex-col"
      onClick={() => onArtworkSelect ? onArtworkSelect(artwork.id) : router.push(`/artwork/${artwork.id}`)}
    >
      <div className="relative aspect-[16/10] bg-muted">
        <img
          src={artwork.thumbnailUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
        
        {/* Progress indicator */}
        {artwork.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${artwork.progress}%` }}
            />
          </div>
        )}
        
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button 
            variant="secondary" 
            size="icon"
            onClick={(e) => handleEdit(artwork.id, e)}
            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
            aria-label="Edit artwork"
          >
            <Icons.edit className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="secondary" 
            size="icon"
            onClick={(e) => handleShare(artwork.id, e)}
            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 delay-75"
            aria-label="Share artwork"
          >
            <Icons.share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="secondary" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteArtwork(artwork);
            }}
            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 delay-100"
            aria-label="Delete artwork"
          >
            <Icons.trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {artwork.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex-1">
          {artwork.packTitle && (
            <p className="text-sm text-muted-foreground mb-2">
              From: {artwork.packTitle}
            </p>
          )}
          
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Icons.clock className="h-3 w-3 mr-1" />
            <span>
              {new Date(artwork.lastEdited).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            
            {artwork.progress > 0 && (
              <span className="ml-auto font-medium">
                {Math.round(artwork.progress)}% Complete
              </span>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );

  return (
    <div className={cn('w-full', className)}>
      <Tabs 
        defaultValue="all" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value as ArtworkStatus | 'all')}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Artwork</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Icons.grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button variant="outline" size="sm">
              <Icons.list className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          {artworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.palette className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No artwork yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Start creating your first masterpiece!
              </p>
              <Button className="mt-4" onClick={() => router.push('/packs')}>
                Browse Packs
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map(renderArtworkCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in_progress" className="mt-0">
          {inProgressArtworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.palette className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No works in progress</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Start a new artwork or continue an existing one.
              </p>
              <Button className="mt-4" onClick={() => router.push('/packs')}>
                Browse Packs
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inProgressArtworks.map(renderArtworkCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {completedArtworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No completed works yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Complete an artwork to see it here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedArtworks.map(renderArtworkCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Recently deleted section (if any) */}
      {deletedArtworks.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Recently Deleted ({deletedArtworks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deletedArtworks.map(({ artwork, timestamp }) => (
              <Card 
                key={artwork.id}
                className="relative overflow-hidden opacity-70 border-dashed"
              >
                <div className="relative aspect-[16/10] bg-muted/50">
                  <img
                    src={artwork.thumbnailUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center">
                    <Icons.trash2 className="h-6 w-6 text-white mb-2" />
                    <p className="text-white text-sm font-medium">
                      Deleted
                    </p>
                    <p className="text-white/80 text-xs mt-1">
                      {Math.ceil((10000 - (Date.now() - timestamp)) / 1000)}s left
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 bg-white/10 hover:bg-white/20 text-white border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreArtwork(artwork.id);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
