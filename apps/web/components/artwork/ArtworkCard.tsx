'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

type ArtworkCardProps = {
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
  lastVisited?: Date | null;
  showCreator?: boolean;
  showLikes?: boolean;
  showLastVisited?: boolean;
  showFavorite?: boolean;
  onLike?: (id: string) => void;
  onFavorite?: (id: string, isFavorite: boolean) => void;
  onStudy?: (id: string) => void;
  onColor?: (id: string) => void;
  className?: string;
};

export function ArtworkCard({
  id,
  title,
  imageUrl,
  creator,
  likes: initialLikes = 0,
  isLiked: initialIsLiked = false,
  isFavorite: initialIsFavorite = false,
  lastVisited,
  showCreator = true,
  showLikes = true,
  showLastVisited = false,
  showFavorite = true,
  onLike,
  onFavorite,
  onStudy,
  onColor,
  className,
}: ArtworkCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();
  
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync with props
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  // Handle like action
  const handleLike = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const newLikedState = !isLiked;
    const newLikes = newLikedState ? likes + 1 : Math.max(0, likes - 1);
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikes(newLikes);
    
    try {
      if (user) {
        // In a real app, you would update the like in your database here
        // await supabase.rpc('toggle_like', { artwork_id: id });
      }
      
      // Call the onLike callback if provided
      if (onLike) {
        onLike(id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setLikes(newLikedState ? likes - 1 : likes + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle favorite action
  const handleFavorite = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const newFavoriteState = !isFavorite;
    
    // Optimistic update
    setIsFavorite(newFavoriteState);
    
    try {
      if (user) {
        // In a real app, you would update the favorite in your database here
        // await supabase.rpc('toggle_favorite', { artwork_id: id });
      } else {
        // For guests, use localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (newFavoriteState) {
          localStorage.setItem('favorites', JSON.stringify([...favorites, id]));
        } else {
          localStorage.setItem(
            'favorites',
            JSON.stringify(favorites.filter((favId: string) => favId !== id))
          );
        }
      }
      
      // Call the onFavorite callback if provided
      if (onFavorite) {
        onFavorite(id, newFavoriteState);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setIsFavorite(!newFavoriteState);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format last visited text
  const formatLastVisited = (date: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className={cn('group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md', className)}>
      {/* Image with overlay on hover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Hover overlay with CTAs */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/90 text-foreground hover:bg-white hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (onStudy) onStudy(id);
              else router.push(`/artwork/${id}/study`);
            }}
          >
            <Icons.bookOpen className="mr-2 h-4 w-4" />
            Study This
          </Button>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onColor) onColor(id);
              else router.push(`/artwork/${id}/color`);
            }}
          >
            <Icons.palette className="mr-2 h-4 w-4" />
            Color This
          </Button>
        </div>
        
        {/* Favorite button */}
        {showFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite();
            }}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-full transition-colors',
              'bg-background/80 hover:bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'text-foreground/70 hover:text-rose-500',
              isFavorite && 'text-rose-500 hover:text-rose-600'
            )}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Icons.heart className={cn('h-5 w-5', isFavorite ? 'fill-current' : 'fill-none')} />
          </button>
        )}
        
        {/* Last visited badge */}
        {showLastVisited && lastVisited && (
          <div className="absolute bottom-2 left-2 bg-background/90 text-xs px-2 py-1 rounded-full">
            Visited {formatLastVisited(lastVisited)}
          </div>
        )}
      </div>
      
      {/* Card footer */}
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-1">{title}</h3>
        
        {/* Creator info */}
        {showCreator && (
          <div className="flex items-center mt-1.5 text-sm text-muted-foreground">
            {creator.avatarUrl && (
              <div className="relative w-5 h-5 rounded-full overflow-hidden mr-2">
                <Image
                  src={creator.avatarUrl}
                  alt={creator.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="line-clamp-1">by {creator.name}</span>
          </div>
        )}
        
        {/* Like button and count */}
        {showLikes && (
          <div className="flex items-center mt-2 text-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={cn(
                'flex items-center text-muted-foreground hover:text-rose-500',
                isLiked && 'text-rose-500'
              )}
              disabled={isProcessing}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Icons.heart className={cn('h-4 w-4 mr-1', isLiked ? 'fill-current' : 'fill-none')} />
              {likes.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
